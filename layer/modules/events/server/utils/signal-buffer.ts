import type { Storage } from 'unstorage'
import type { H3Event } from 'h3'
import type { SignalInput, SignalRow, SignalVisitor } from '../../runtime/types/signal'
import { resolveSignalEnv } from './signal-env'
import { createSaltKeeper, hashVisitor } from './visitor-hash'
import type { SaltKeeper } from './visitor-hash'

/**
 * Ring-buffer depth, sized from the identity-event stream.
 *
 * Before identity events a visit produced ~5-8 rows (a couple of section views,
 * maybe an offer click, the odd error). The always-on click + section-visibility
 * stream adds roughly 10-50 rows per visitor-minute; at ~30/min over a ~2 minute
 * engaged session that is ~60 rows per visit — about 10x the old volume. Raising
 * 10_000 → 100_000 keeps the retention the old number bought: at a modelled 200
 * sessions/day (~12k rows/day) the buffer holds ~8 days, so an external consumer
 * can be down for a week without losing rows. Cost is bounded — ~350 bytes of
 * serialised row, so ~35 MB at a full 100_000 in the default memory driver.
 */
export const DEFAULT_SIGNAL_CAPACITY = 100_000
/** Raised with the buffer: a consumer catching up over a 10x deeper buffer pages half as often. */
export const MAX_EXPORT_LIMIT = 2000

const META_KEY = 'meta'
const rowKey = (seq: number) => `row:${seq}`

export interface SignalBufferOptions {
  capacity?: number
}

export interface SignalReadResult {
  rows: SignalRow[]
  cursor: number
}

export interface SignalBuffer {
  append: (input: SignalInput) => Promise<SignalRow>
  read: (sinceSeq?: number, limit?: number) => Promise<SignalReadResult>
  capacity: number
}

/**
 * Capped ring buffer over an unstorage driver (memory by default — mount
 * `signals` to fs/KV in nuxt.config to survive restarts). `seq` is the cursor.
 */
export function createSignalBuffer(
  storage: Storage,
  options: SignalBufferOptions = {},
): SignalBuffer {
  const capacity = Math.max(1, options.capacity ?? DEFAULT_SIGNAL_CAPACITY)

  let head: number | null = null
  // Serialises appends so `seq` stays monotonic under concurrent requests.
  let tail: Promise<unknown> = Promise.resolve()

  const loadHead = async () => {
    if (head === null) {
      const meta = await storage.getItem<{ head?: number }>(META_KEY)
      head = Number(meta?.head) || 0
    }
    return head
  }

  const oldestSeq = (current: number) => Math.max(1, current - capacity + 1)

  const append = async (input: SignalInput): Promise<SignalRow> => {
    const seq = (await loadHead()) + 1
    head = seq

    const row: SignalRow = {
      ...input,
      id: input.id || crypto.randomUUID(),
      ts: input.ts ?? Date.now(),
      site: input.site ?? '',
      seq,
    }

    await storage.setItem(rowKey(seq), row)
    if (seq - capacity >= 1) await storage.removeItem(rowKey(seq - capacity))
    await storage.setItem(META_KEY, { head: seq })

    return row
  }

  const read = async (sinceSeq = 0, limit = 100): Promise<SignalReadResult> => {
    const current = await loadHead()
    const max = Math.min(Math.max(1, Math.trunc(limit) || 1), MAX_EXPORT_LIMIT)
    const from = Math.max(Math.trunc(sinceSeq) + 1, oldestSeq(current))

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

  return {
    // Chain every append onto the queue so callers can fire-and-forget.
    append: (input) => {
      const next = tail.then(() => append(input))
      tail = next.catch(() => {})
      return next
    },
    read,
    capacity,
  }
}

// === Nitro-bound singleton ===

let buffer: SignalBuffer | null = null
let salts: SaltKeeper | null = null

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
async function resolveVisitorHash(site: string, event?: H3Event): Promise<string | undefined> {
  const ip = event && getRequestIP(event, { xForwardedFor: true })
  if (!ip) return undefined
  salts ??= createSaltKeeper(useStorage('signals'))
  return hashVisitor({ salt: await salts.current(), site, ip, userAgent: getHeader(event, 'user-agent') })
}

/**
 * The one choke point every capture path funnels through (ingest, webhook,
 * error hook, page_request middleware, mcp middleware) — so `site`,
 * `visitor.hash` and the `env: 'local'` debug marker are stamped exactly once,
 * here, rather than at each call site. A caller-supplied `visitor.hash` is
 * never trusted: it is always replaced, or dropped when there is no request.
 */
export async function appendSignal(input: SignalInput, event?: H3Event): Promise<SignalRow> {
  const { visitor: claimed, ...row } = input
  const env = row.env ?? resolveEnvMarker(event)
  const site = row.site || resolveSite(event)
  const { hash: _untrusted, ...visitor } = claimed ?? {}
  const hash = await resolveVisitorHash(site, event)
  const stamped: SignalVisitor = hash ? { ...visitor, hash } : visitor

  return getSignalBuffer().append({
    ...row,
    site,
    ...(Object.keys(stamped).length ? { visitor: stamped } : {}),
    ...(env ? { env } : {}),
  })
}

export function readSignals(sinceSeq = 0, limit = 100): Promise<SignalReadResult> {
  return getSignalBuffer().read(sinceSeq, limit)
}
