import type { Storage } from 'unstorage'
import type { H3Event } from 'h3'
import type { SignalInput, SignalRow, SignalVisitor } from '../../runtime/types/signal'
import { resolveSignalEnv } from './signal-env'
import { describeDevice } from './visitor-device'
import { createSaltKeeper, hashVisitor } from './visitor-hash'
import type { SaltKeeper } from './visitor-hash'

/**
 * Ring-buffer depth, sized from the identity-event stream.
 *
 * Before identity events a visit produced ~5-8 rows (a couple of section views,
 * maybe an offer click, the odd error). The always-on click + section-visibility
 * stream adds roughly 10-50 rows per visitor-minute; at ~30/min over a ~2 minute
 * engaged session that is ~60 rows per visit — about 10x the old volume. At a
 * modelled 200 sessions/day (~12k rows/day), 170_000 rows covers the full
 * `DEFAULT_SIGNAL_RETENTION_MS` window (14 days) with headroom, so a consumer
 * that's down for the entire retention window still catches up without gaps.
 * Cost is bounded — ~350 bytes of serialised row, so ~60 MB at a full 170_000
 * in the default memory driver. Set `NUXT_SIGNAL_STORE_DIR` (see
 * `server/plugins/signal-storage.ts`) to mount `signals` onto disk instead —
 * e.g. a Railway Volume — so the buffer survives a restart.
 */
export const DEFAULT_SIGNAL_CAPACITY = 170_000
/** Raised with the buffer: a consumer catching up over a 10x deeper buffer pages half as often. */
export const MAX_EXPORT_LIMIT = 2000
/**
 * Time-based retention, independent of the capacity cap: a row older than this
 * is pruned even if the buffer is nowhere near full (a quiet site would
 * otherwise hold rows indefinitely). 14 days matches the epic's retention
 * promise (product-validator-ev2).
 */
export const DEFAULT_SIGNAL_RETENTION_MS = 14 * 24 * 60 * 60 * 1000
/** `used / capacity` at which a `quota_low` warning row is appended once (edge-triggered). */
const NEAR_CAPACITY_RATIO = 0.9

const META_KEY = 'meta'
const rowKey = (seq: number) => `row:${seq}`

export interface SignalBufferOptions {
  capacity?: number
  /** Rows older than this are pruned on append, regardless of capacity. */
  retentionMs?: number
}

export interface SignalReadResult {
  rows: SignalRow[]
  cursor: number
}

export interface SignalBufferUsage {
  used: number
  capacity: number
}

export interface SignalBuffer {
  append: (input: SignalInput) => Promise<SignalRow>
  read: (sinceSeq?: number, limit?: number) => Promise<SignalReadResult>
  /** Live row count vs capacity — used by the singleton to decide when to warn. */
  usage: () => Promise<SignalBufferUsage>
  capacity: number
}

/**
 * Capped, time-retained ring buffer over an unstorage driver (memory by
 * default — `server/plugins/signal-storage.ts` mounts `signals` onto disk via
 * `NUXT_SIGNAL_STORE_DIR` so it survives restarts). `seq` is the cursor.
 *
 * Two eviction rules, both enforced on every append and merged into one
 * `oldest` cursor (persisted in `meta` alongside `head` so both survive a
 * restart): the hard `capacity` cap, and `retentionMs` — a row older than the
 * window is pruned even when the buffer is far from full.
 */
export function createSignalBuffer(
  storage: Storage,
  options: SignalBufferOptions = {},
): SignalBuffer {
  const capacity = Math.max(1, options.capacity ?? DEFAULT_SIGNAL_CAPACITY)
  const retentionMs = Math.max(0, options.retentionMs ?? DEFAULT_SIGNAL_RETENTION_MS)

  let head: number | null = null
  let oldest: number | null = null
  // Serialises appends so `seq` stays monotonic under concurrent requests.
  let tail: Promise<unknown> = Promise.resolve()

  const loadMeta = async () => {
    if (head === null || oldest === null) {
      const meta = await storage.getItem<{ head?: number, oldest?: number }>(META_KEY)
      head = Number(meta?.head) || 0
      oldest = Number(meta?.oldest) || 1
    }
    return { head, oldest }
  }

  /**
   * Advance the `oldest` cursor forward, removing everything it passes: first
   * unconditionally up to the hard capacity floor, then — only while
   * `retentionMs` is enabled — while the next row in line is older than the
   * cutoff. Rows are appended in roughly chronological order, so a single
   * forward walk (not a full scan) is enough to find the retained window.
   *
   * Scoped to exact `row:<seq>` keys only — never `storage.clear()` or a
   * prefix sweep. The `signals` mount also carries other keys (`meta`, and
   * the identity branch's `visitor-salt`); a blanket clear would take those
   * out too.
   */
  const prune = async (capacityFloor: number, currentHead: number) => {
    let cursor = oldest ?? 1

    while (cursor < capacityFloor) {
      await storage.removeItem(rowKey(cursor))
      cursor++
    }

    if (retentionMs > 0) {
      const cutoff = Date.now() - retentionMs
      while (cursor <= currentHead) {
        const candidate = await storage.getItem<SignalRow>(rowKey(cursor))
        if (!candidate) {
          cursor++
          continue
        }
        if (candidate.ts >= cutoff) break
        await storage.removeItem(rowKey(cursor))
        cursor++
      }
    }

    oldest = cursor
  }

  const writeRow = async (input: SignalInput): Promise<SignalRow> => {
    const { head: currentHead } = await loadMeta()
    const seq = currentHead + 1
    head = seq

    const row: SignalRow = {
      ...input,
      id: input.id || crypto.randomUUID(),
      ts: input.ts ?? Date.now(),
      site: input.site ?? '',
      seq,
    }

    await storage.setItem(rowKey(seq), row)
    await prune(Math.max(1, seq - capacity + 1), seq)
    await storage.setItem(META_KEY, { head: seq, oldest })

    return row
  }

  const read = async (sinceSeq = 0, limit = 100): Promise<SignalReadResult> => {
    const { head: current, oldest: floor } = await loadMeta()
    const max = Math.min(Math.max(1, Math.trunc(limit) || 1), MAX_EXPORT_LIMIT)
    const from = Math.max(Math.trunc(sinceSeq) + 1, floor)

    const rows: SignalRow[] = []
    for (let seq = from; seq <= current && rows.length < max; seq++) {
      const row = await storage.getItem<SignalRow>(rowKey(seq))
      if (row) rows.push(row)
    }

    const last = rows.at(-1)
    return {
      rows,
      cursor: last ? last.seq : Math.min(Math.max(0, Math.trunc(sinceSeq)), current),
    }
  }

  const usage = async (): Promise<SignalBufferUsage> => {
    const { head: current, oldest: floor } = await loadMeta()
    return { used: Math.max(0, current - floor + 1), capacity }
  }

  return {
    // Chain every append onto the queue so callers can fire-and-forget.
    append: (input) => {
      const next = tail.then(() => writeRow(input))
      tail = next.catch(() => {})
      return next
    },
    read,
    usage,
    capacity,
  }
}

// === Nitro-bound singleton ===

let buffer: SignalBuffer | null = null
let salts: SaltKeeper | null = null
// Edge-triggered: one `quota_low` row per crossing into the danger zone, not
// one per append while it stays there. Lives here (not in `createSignalBuffer`)
// so the pure ring-buffer unit tests — several of which use a tiny capacity on
// purpose, to exercise wraparound — never trip it and get a surprise extra row.
let warnedNearCapacity = false

function getSignalBuffer(): SignalBuffer {
  if (!buffer) {
    const capacity = Number(
      (useRuntimeConfig().signals as { capacity?: number } | undefined)?.capacity,
    )
    buffer = createSignalBuffer(useStorage('signals'), {
      capacity: capacity || DEFAULT_SIGNAL_CAPACITY,
    })
  }
  return buffer
}

/**
 * After every append, check whether the live buffer just crossed
 * `NEAR_CAPACITY_RATIO` and, if so, append one `quota_low` warning row.
 * Fire-and-forget and re-entrant-safe: the warning row is itself an append,
 * which re-runs this check, but the latch is set before that recursive call
 * starts, so it sees itself already warned and returns without looping.
 */
async function warnIfNearCapacity(): Promise<void> {
  const { used, capacity } = await getSignalBuffer().usage()
  const ratio = used / capacity

  if (ratio < NEAR_CAPACITY_RATIO) {
    warnedNearCapacity = false
    return
  }
  if (warnedNearCapacity) return

  warnedNearCapacity = true
  await appendSignal({
    kind: 'log',
    severity: 'warning',
    name: 'quota_low',
    data: { used, capacity, ratio: Number(ratio.toFixed(3)) },
  })
}

/** `runtimeConfig.public.siteId`, falling back to the request host. */
export function resolveSite(event?: H3Event): string {
  const configured = useRuntimeConfig(event).public.siteId as string | undefined
  if (configured) return configured
  return (event && getRequestHost(event)) || 'unknown'
}

/**
 * `SignalRow.env` for this append. `import.meta.dev` is the default signal;
 * `runtimeConfig.public.signalEnv` (`NUXT_PUBLIC_SIGNAL_ENV`) is the explicit
 * override — see `resolveSignalEnv()` for the precedence rule.
 */
function resolveEnvMarker(event?: H3Event): 'local' | undefined {
  const configured = useRuntimeConfig(event).public.signalEnv as string | undefined
  return resolveSignalEnv({ isDev: import.meta.dev, configuredEnv: configured })
}

/**
 * `visitor.hash` for this request — see `visitor-hash.ts`. `X-Forwarded-For` is
 * honoured because Railway (and any proxy in front of Nitro) terminates the
 * connection; without it every visitor would hash to the proxy's address.
 * Undefined when there is no request, or no address to hash.
 */
async function resolveVisitorHash(
  site: string,
  userAgent: string | undefined,
  event?: H3Event,
): Promise<string | undefined> {
  const ip = event && getRequestIP(event, { xForwardedFor: true })
  if (!ip) return undefined
  salts ??= createSaltKeeper(useStorage('signals'))
  return hashVisitor({ salt: await salts.current(), site, ip, userAgent })
}

/**
 * The one choke point every capture path funnels through (ingest, webhook,
 * error hook, page_request middleware, mcp middleware) — so `site`, the
 * request-derived visitor fields (`hash`, `device`, `browser`, `os`) and the
 * `env: 'local'` debug marker are stamped exactly once, here, rather than at
 * each call site. Caller-supplied values for those visitor fields are never
 * trusted: they are replaced from the request, or dropped when there is none.
 */
export async function appendSignal(input: SignalInput, event?: H3Event): Promise<SignalRow> {
  const { visitor: claimed, ...row } = input
  const env = row.env ?? resolveEnvMarker(event)
  const site = row.site || resolveSite(event)
  const { hash: _h, device: _d, browser: _b, os: _o, ...visitor } = claimed ?? {}
  const userAgent = event ? getHeader(event, 'user-agent') : undefined
  const hash = await resolveVisitorHash(site, userAgent, event)
  const stamped: SignalVisitor = {
    ...visitor,
    ...(hash ? { hash } : {}),
    ...describeDevice(userAgent),
  }

  const appended = getSignalBuffer().append({
    ...row,
    site,
    ...(Object.keys(stamped).length ? { visitor: stamped } : {}),
    ...(env ? { env } : {}),
  })
  // Never let the capacity check slow down or fail the caller's own append.
  void appended.then(() => warnIfNearCapacity()).catch(() => {})
  return appended
}

export function readSignals(sinceSeq = 0, limit = 100): Promise<SignalReadResult> {
  return getSignalBuffer().read(sinceSeq, limit)
}
