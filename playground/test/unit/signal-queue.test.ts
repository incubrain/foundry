import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { SignalInput } from '@incubrain/foundry/modules/events/runtime/types/signal'

// The queue is module-level state — load a fresh copy per test. Every copy keeps
// its own `pagehide` listener on the shared window, so afterEach drains them.
const loaded: Array<{ flush: () => Promise<void> }> = []
const load = async () => {
  vi.resetModules()
  const { useSignalQueue } = await import('@incubrain/foundry/modules/events/runtime/composables/useSignalQueue')
  const queue = useSignalQueue()
  loaded.push(queue)
  return queue
}

const row = (n: number): SignalInput => ({ kind: 'event', name: `e${n}` })
const httpError = (statusCode?: number) => Object.assign(new Error('fetch failed'), { statusCode })

type Fetch = ReturnType<typeof vi.fn>
const batches = (fetch: Fetch) => fetch.mock.calls.map(call => (call[1] as { body: { rows: SignalInput[] } }).body.rows)
const names = (rows: SignalInput[]) => rows.map(r => r.name)

describe('useSignalQueue: delivery failures are retried once and counted', () => {
  let $fetch: Fetch

  beforeEach(() => {
    vi.useFakeTimers()
    $fetch = vi.fn().mockResolvedValue({ accepted: 1 })
    vi.stubGlobal('$fetch', $fetch)
  })

  afterEach(async () => {
    $fetch.mockReset().mockResolvedValue({ accepted: 1 })
    for (const queue of loaded.splice(0)) for (let i = 0; i < 6; i++) await queue.flush()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('requeues a batch once after a network error and sends it again', async () => {
    const { enqueue, flush } = await load()
    $fetch.mockRejectedValueOnce(httpError())

    enqueue(row(1))
    enqueue(row(2))
    await flush()
    await flush()

    expect(names(batches($fetch)[0]!)).toEqual(['e1', 'e2'])
    expect(names(batches($fetch)[1]!)).toEqual(['e1', 'e2'])
  })

  it('requeues after a 5xx too', async () => {
    const { enqueue, flush } = await load()
    $fetch.mockRejectedValueOnce(httpError(503))

    enqueue(row(1))
    await flush()
    await flush()

    expect($fetch).toHaveBeenCalledTimes(2)
  })

  it('drops rows that fail twice and reports them as retry_exhausted on the next good flush', async () => {
    const { enqueue, flush } = await load()
    $fetch.mockRejectedValueOnce(httpError(500)).mockRejectedValueOnce(httpError(500))

    enqueue(row(1))
    enqueue(row(2))
    await flush() // fail -> requeued
    await flush() // fail again -> dropped
    await flush() // nothing queued, nothing sent
    expect($fetch).toHaveBeenCalledTimes(2)

    enqueue(row(3))
    await flush()

    expect(batches($fetch)[2]).toEqual([
      { kind: 'log', name: 'client_dropped', severity: 'warning', data: { count: 2, reason: 'retry_exhausted' } },
      row(3),
    ])
  })

  it('drops a 4xx without retrying and reports it as rejected', async () => {
    const { enqueue, flush } = await load()
    $fetch.mockRejectedValueOnce(httpError(400))

    enqueue(row(1))
    enqueue(row(2))
    enqueue(row(3))
    await flush()
    await flush() // queue is empty: no retry
    expect($fetch).toHaveBeenCalledTimes(1)

    enqueue(row(4))
    await flush()

    expect(batches($fetch)[1]).toEqual([
      { kind: 'log', name: 'client_dropped', severity: 'warning', data: { count: 3, reason: 'rejected' } },
      row(4),
    ])
  })

  it('caps the buffer at 200 rows, dropping the oldest and counting them as overflow', async () => {
    const { enqueue, flush } = await load()
    $fetch.mockRejectedValue(httpError(503))

    // 250 rows -> five 50-row batches in flight, all failing and requeueing.
    for (let i = 0; i < 250; i++) enqueue(row(i))
    await vi.advanceTimersByTimeAsync(0)
    $fetch.mockReset().mockResolvedValue({ accepted: 1 })
    await flush()

    const [first] = batches($fetch)
    expect(first![0]).toEqual({ kind: 'log', name: 'client_dropped', severity: 'warning', data: { count: 50, reason: 'overflow' } })
    // e0-e49 (the oldest) were dropped; the next-oldest are sent first, in order.
    expect(names(first!).slice(1, 4)).toEqual(['e50', 'e51', 'e52'])
  })

  it('restores the client_dropped counts when the batch carrying them fails', async () => {
    const { enqueue, flush } = await load()
    $fetch.mockRejectedValueOnce(httpError(400))
    enqueue(row(1))
    await flush() // rejected -> counted

    $fetch.mockRejectedValueOnce(httpError(502)) // the notice's own batch fails
    enqueue(row(2))
    await flush()
    enqueue(row(3))
    await flush()

    const last = batches($fetch).at(-1)!
    expect(last.filter(r => r.name === 'client_dropped')).toEqual([
      { kind: 'log', name: 'client_dropped', severity: 'warning', data: { count: 1, reason: 'rejected' } },
    ])
  })

  it('never throws, even when the request cannot be built', async () => {
    const { enqueue, flush } = await load()
    $fetch.mockImplementation(() => {
      throw new Error('sync failure')
    })

    enqueue(row(1))

    await expect(flush()).resolves.toBeUndefined()
  })

  it('does not log', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(k => vi.spyOn(console, k).mockImplementation(() => {}))
    const { enqueue, flush } = await load()
    $fetch.mockRejectedValue(httpError(500))

    enqueue(row(1))
    await flush()
    await flush()

    expect(spies.every(spy => spy.mock.calls.length === 0)).toBe(true)
    spies.forEach(spy => spy.mockRestore())
  })

  it('sends the queue with sendBeacon on pagehide', async () => {
    const sendBeacon = vi.fn().mockReturnValue(true)
    vi.stubGlobal('navigator', { ...navigator, sendBeacon })
    const { enqueue } = await load()

    enqueue(row(1))
    window.dispatchEvent(new Event('pagehide'))

    // (The running app's own queue also beacons on pagehide — look for our row.)
    const bodies = await Promise.all(sendBeacon.mock.calls.map(call => (call[1] as Blob).text()))
    expect(bodies.some(body => body.includes('"name":"e1"'))).toBe(true)
    expect($fetch).not.toHaveBeenCalled()
  })
})
