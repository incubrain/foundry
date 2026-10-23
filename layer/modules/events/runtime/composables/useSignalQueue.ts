import { useDebounceFn, useEventListener } from '@vueuse/core'
import type { SignalInput } from '../types/signal'

const ENDPOINT = '/api/_signals/ingest'
/**
 * Rows buffered before an immediate flush, and the most rows sent per request.
 * Raised from 25 with the identity-event stream so a click burst batches instead
 * of firing extra requests; still well under the ingest handler's 100-row cap and
 * under `sendBeacon`'s ~64 KB limit (50 rows ≈ 20 KB).
 */
const MAX_QUEUE = 50
/** Hard cap on buffered rows (failed flushes requeue). Oldest rows go first. */
const MAX_BUFFER = 200

/** Why a row never reached the server — reported back as a `client_dropped` row. */
type DropReason = 'rejected' | 'retry_exhausted' | 'overflow'
const REASONS: DropReason[] = ['rejected', 'retry_exhausted', 'overflow']

const queue: SignalInput[] = []
/**
 * Per-row bookkeeping: `seq` is enqueue order (so a requeued batch slots back in
 * where it belongs and "oldest" stays true), `retried` marks a row that already
 * failed one flush — its next failure drops it.
 */
const meta = new WeakMap<SignalInput, { seq: number, retried: boolean }>()
let seq = 0
const dropped: Record<DropReason, number> = { rejected: 0, retry_exhausted: 0, overflow: 0 }
let listening = false

/** HTTP status off a failed `$fetch` (ofetch FetchError); undefined for a network error. */
const statusOf = (error: unknown): number | undefined => {
  const e = error as { statusCode?: number, status?: number, response?: { status?: number } } | null
  return e?.statusCode ?? e?.status ?? e?.response?.status
}

/** One `client_dropped` warning row per reason with a non-zero count; resets the counts. */
const takeDropNotices = (): { rows: SignalInput[], counts: Partial<Record<DropReason, number>> } => {
  const rows: SignalInput[] = []
  const counts: Partial<Record<DropReason, number>> = {}
  for (const reason of REASONS) {
    const count = dropped[reason]
    if (!count) continue
    rows.push({ kind: 'log', name: 'client_dropped', severity: 'warning', data: { count, reason } })
    counts[reason] = count
    dropped[reason] = 0
  }
  return { rows, counts }
}

/**
 * Client-side batch queue for signal rows. Debounced POST during the session,
 * `sendBeacon` on pagehide so the last rows survive the unload.
 *
 * Delivery is best effort but never silent: a failed flush (network error or 5xx)
 * requeues its rows once; a 4xx drops them (retrying cannot help). Every row that
 * is given up on is counted by reason and reported in the next successful flush
 * as a `client_dropped` row. Nothing here throws or logs.
 */
export const useSignalQueue = () => {
  const drop = (reason: DropReason, count: number) => {
    dropped[reason] += count
  }

  const requeue = (rows: SignalInput[]) => {
    for (const row of rows) {
      const info = meta.get(row)
      if (info && !info.retried) {
        info.retried = true
        queue.push(row)
      }
      else drop('retry_exhausted', 1)
    }
    queue.sort((a, b) => meta.get(a)!.seq - meta.get(b)!.seq)
    trim()
  }

  const trim = () => {
    if (queue.length > MAX_BUFFER) drop('overflow', queue.splice(0, queue.length - MAX_BUFFER).length)
  }

  const send = async (batch: SignalInput[], beacon: boolean) => {
    const notices = takeDropNotices()
    const rows = [...notices.rows, ...batch]

    try {
      if (beacon) {
        const body = JSON.stringify({ rows })
        if (navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: 'application/json' }))) return
      }
      await $fetch(ENDPOINT, { method: 'POST', body: { rows } })
    }
    catch (error) {
      // The notices travelled with the failed request — hand their counts back.
      for (const reason of REASONS) drop(reason, notices.counts[reason] ?? 0)
      const status = statusOf(error)
      if (status !== undefined && status >= 400 && status < 500) drop('rejected', batch.length)
      else requeue(batch)
    }
  }

  const flush = async (beacon = false): Promise<void> => {
    if (!import.meta.client || !queue.length) return

    // Pagehide is the last chance: send everything now, as beacon-sized chunks
    // issued back to back (each beacon is queued synchronously, before any await).
    const rows = queue.splice(0, beacon ? queue.length : MAX_QUEUE)
    if (queue.length) void flushSoon()

    try {
      const chunks: SignalInput[][] = []
      for (let i = 0; i < rows.length; i += MAX_QUEUE) chunks.push(rows.slice(i, i + MAX_QUEUE))
      await Promise.all(chunks.map(chunk => send(chunk, beacon)))
    }
    catch {
      // Capture must never break the page.
    }
  }

  const flushSoon = useDebounceFn(() => flush(), 800, { maxWait: 4000 })

  if (import.meta.client && !listening) {
    listening = true
    useEventListener(window, 'pagehide', () => void flush(true))
  }

  const enqueue = (row: SignalInput) => {
    if (!import.meta.client) return
    meta.set(row, { seq: seq++, retried: false })
    queue.push(row)
    trim()
    if (queue.length >= MAX_QUEUE) void flush()
    else void flushSoon()
  }

  return { enqueue, flush }
}
