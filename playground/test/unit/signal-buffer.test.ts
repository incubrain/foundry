import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it, expect, afterEach } from 'vitest'
import { createStorage } from 'unstorage'
import memoryDriver from 'unstorage/drivers/memory'
import fsDriver from 'unstorage/drivers/fs'
import {
  createSignalBuffer,
  DEFAULT_SIGNAL_CAPACITY,
  DEFAULT_SIGNAL_RETENTION_MS,
  MAX_EXPORT_LIMIT,
} from '@incubrain/foundry/modules/events/server/utils/signal-buffer'
import type { SignalInput } from '@incubrain/foundry/modules/events/runtime/types/signal'

const makeBuffer = (capacity?: number, retentionMs?: number) =>
  createSignalBuffer(createStorage({ driver: memoryDriver() }), { capacity, retentionMs })

const event = (name: string): SignalInput => ({
  kind: 'event',
  name,
  site: 'test-site',
})

describe('createSignalBuffer', () => {
  it('assigns monotonic seq numbers starting at 1', async () => {
    const buffer = makeBuffer()

    const first = await buffer.append(event('a'))
    const second = await buffer.append(event('b'))

    expect(first.seq).toBe(1)
    expect(second.seq).toBe(2)
  })

  it('fills in id and ts when omitted', async () => {
    const row = await makeBuffer().append(event('a'))

    expect(row.id).toBeTruthy()
    expect(row.ts).toBeGreaterThan(0)
  })

  it('preserves a caller-supplied id and ts', async () => {
    const row = await makeBuffer().append({ ...event('a'), id: 'fixed', ts: 42 })

    expect(row.id).toBe('fixed')
    expect(row.ts).toBe(42)
  })

  it('defaults to a 170_000 row capacity (14 days of the identity-event stream)', () => {
    expect(makeBuffer().capacity).toBe(DEFAULT_SIGNAL_CAPACITY)
    expect(DEFAULT_SIGNAL_CAPACITY).toBe(170_000)
  })

  it('keeps only the newest rows once capacity is exceeded (wraparound)', async () => {
    const buffer = makeBuffer(3)
    for (const name of ['a', 'b', 'c', 'd', 'e']) await buffer.append(event(name))

    const { rows } = await buffer.read(0, 100)

    expect(rows.map(row => row.name)).toEqual(['c', 'd', 'e'])
    expect(rows.map(row => row.seq)).toEqual([3, 4, 5])
  })

  it('never rewinds seq after eviction', async () => {
    const buffer = makeBuffer(2)
    for (const name of ['a', 'b', 'c']) await buffer.append(event(name))

    const next = await buffer.append(event('d'))
    expect(next.seq).toBe(4)
  })
})

describe('signal buffer cursor semantics', () => {
  it('returns only rows after the cursor', async () => {
    const buffer = makeBuffer()
    for (const name of ['a', 'b', 'c']) await buffer.append(event(name))

    const { rows, cursor } = await buffer.read(1, 100)

    expect(rows.map(row => row.name)).toEqual(['b', 'c'])
    expect(cursor).toBe(3)
  })

  it('returns an empty page and a stable cursor when nothing is new', async () => {
    const buffer = makeBuffer()
    await buffer.append(event('a'))

    const { rows, cursor } = await buffer.read(1, 100)

    expect(rows).toEqual([])
    expect(cursor).toBe(1)
  })

  it('reads an empty buffer without throwing', async () => {
    const { rows, cursor } = await makeBuffer().read(0, 100)

    expect(rows).toEqual([])
    expect(cursor).toBe(0)
  })

  it('honours the limit and lets the cursor page forward', async () => {
    const buffer = makeBuffer()
    for (const name of ['a', 'b', 'c', 'd']) await buffer.append(event(name))

    const first = await buffer.read(0, 2)
    expect(first.rows.map(row => row.name)).toEqual(['a', 'b'])
    expect(first.cursor).toBe(2)

    const second = await buffer.read(first.cursor, 2)
    expect(second.rows.map(row => row.name)).toEqual(['c', 'd'])
    expect(second.cursor).toBe(4)
  })

  it('skips evicted rows when the consumer is far behind', async () => {
    const buffer = makeBuffer(2)
    for (const name of ['a', 'b', 'c', 'd']) await buffer.append(event(name))

    const { rows, cursor } = await buffer.read(0, 100)

    expect(rows.map(row => row.seq)).toEqual([3, 4])
    expect(cursor).toBe(4)
  })

  it('clamps the limit to the export maximum', async () => {
    const buffer = makeBuffer()
    for (let i = 0; i < 5; i++) await buffer.append(event(`e${i}`))

    const { rows } = await buffer.read(0, MAX_EXPORT_LIMIT + 5000)
    expect(rows).toHaveLength(5)
    expect(MAX_EXPORT_LIMIT).toBe(2000)
  })

  it('keeps seq monotonic under concurrent appends', async () => {
    const buffer = makeBuffer()

    await Promise.all(
      Array.from({ length: 20 }, (_, i) => buffer.append(event(`e${i}`))),
    )

    const { rows } = await buffer.read(0, 100)
    expect(rows.map(row => row.seq)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 1),
    )
  })

  it('resumes seq from persisted storage state', async () => {
    const storage = createStorage({ driver: memoryDriver() })

    const first = createSignalBuffer(storage)
    await first.append(event('a'))
    await first.append(event('b'))

    const resumed = createSignalBuffer(storage)
    const row = await resumed.append(event('c'))

    expect(row.seq).toBe(3)
  })
})

describe('time-based retention', () => {
  it('defaults to a 14-day retention window', () => {
    expect(DEFAULT_SIGNAL_RETENTION_MS).toBe(14 * 24 * 60 * 60 * 1000)
  })

  it('prunes a row older than the retention window on the next append', async () => {
    const buffer = makeBuffer(undefined, DEFAULT_SIGNAL_RETENTION_MS)
    const old = Date.now() - DEFAULT_SIGNAL_RETENTION_MS - 1000

    await buffer.append({ ...event('old'), ts: old })
    await buffer.append(event('new'))

    const { rows } = await buffer.read(0, 100)
    expect(rows.map(row => row.name)).toEqual(['new'])
  })

  it('keeps a row within the retention window', async () => {
    const buffer = makeBuffer(undefined, DEFAULT_SIGNAL_RETENTION_MS)
    const recent = Date.now() - 1000

    await buffer.append({ ...event('recent'), ts: recent })
    await buffer.append(event('new'))

    const { rows } = await buffer.read(0, 100)
    expect(rows.map(row => row.name)).toEqual(['recent', 'new'])
  })

  it('prunes several expired rows in one pass, oldest-first', async () => {
    const buffer = makeBuffer(undefined, DEFAULT_SIGNAL_RETENTION_MS)
    const old = Date.now() - DEFAULT_SIGNAL_RETENTION_MS - 1000

    await buffer.append({ ...event('a'), ts: old })
    await buffer.append({ ...event('b'), ts: old })
    await buffer.append({ ...event('c'), ts: old })
    await buffer.append(event('d'))

    const { rows } = await buffer.read(0, 100)
    expect(rows.map(row => row.name)).toEqual(['d'])
  })

  it('never rewinds seq or the cursor when rows expire', async () => {
    const buffer = makeBuffer(undefined, DEFAULT_SIGNAL_RETENTION_MS)
    const old = Date.now() - DEFAULT_SIGNAL_RETENTION_MS - 1000

    await buffer.append({ ...event('old'), ts: old })
    const second = await buffer.append(event('new'))

    expect(second.seq).toBe(2)
    const { cursor } = await buffer.read(0, 100)
    expect(cursor).toBe(2)
  })

  it('disables time-based pruning when retentionMs is 0', async () => {
    const buffer = makeBuffer(undefined, 0)
    const ancient = Date.now() - DEFAULT_SIGNAL_RETENTION_MS * 10

    await buffer.append({ ...event('ancient'), ts: ancient })
    await buffer.append(event('new'))

    const { rows } = await buffer.read(0, 100)
    expect(rows.map(row => row.name)).toEqual(['ancient', 'new'])
  })

  it('still enforces the hard capacity cap alongside retention', async () => {
    const buffer = makeBuffer(2, DEFAULT_SIGNAL_RETENTION_MS)
    for (const name of ['a', 'b', 'c']) await buffer.append(event(name))

    const { rows } = await buffer.read(0, 100)
    expect(rows.map(row => row.name)).toEqual(['b', 'c'])
  })
})

describe('usage()', () => {
  it('reports 0 used against an empty buffer', async () => {
    const buffer = makeBuffer(10)
    expect(await buffer.usage()).toEqual({ used: 0, capacity: 10 })
  })

  it('tracks live row count as rows are appended', async () => {
    const buffer = makeBuffer(10)
    await buffer.append(event('a'))
    await buffer.append(event('b'))

    expect(await buffer.usage()).toEqual({ used: 2, capacity: 10 })
  })

  it('reflects capacity eviction in the used count', async () => {
    const buffer = makeBuffer(2)
    for (const name of ['a', 'b', 'c']) await buffer.append(event(name))

    expect(await buffer.usage()).toEqual({ used: 2, capacity: 2 })
  })

  it('reflects retention pruning in the used count', async () => {
    const buffer = makeBuffer(undefined, DEFAULT_SIGNAL_RETENTION_MS)
    const old = Date.now() - DEFAULT_SIGNAL_RETENTION_MS - 1000

    await buffer.append({ ...event('old'), ts: old })
    await buffer.append(event('new'))

    expect(await buffer.usage()).toEqual({ used: 1, capacity: DEFAULT_SIGNAL_CAPACITY })
  })
})

describe('fs driver — restart persistence', () => {
  let dir: string

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true })
  })

  it('resumes seq, oldest and row content after the process "restarts"', async () => {
    dir = mkdtempSync(join(tmpdir(), 'foundry-signal-buffer-'))

    const first = createSignalBuffer(createStorage({ driver: fsDriver({ base: dir }) }))
    await first.append(event('a'))
    await first.append(event('b'))

    // A restart means a brand-new Storage/driver instance pointed at the same
    // directory — nothing is held in process memory across this boundary.
    const restarted = createSignalBuffer(createStorage({ driver: fsDriver({ base: dir }) }))
    const row = await restarted.append(event('c'))

    expect(row.seq).toBe(3)

    const { rows } = await restarted.read(0, 100)
    expect(rows.map(r => r.name)).toEqual(['a', 'b', 'c'])
  })

  it('persists the capacity floor across a restart, not just seq', async () => {
    dir = mkdtempSync(join(tmpdir(), 'foundry-signal-buffer-'))

    const first = createSignalBuffer(createStorage({ driver: fsDriver({ base: dir }) }), { capacity: 2 })
    for (const name of ['a', 'b', 'c']) await first.append(event(name))

    const restarted = createSignalBuffer(createStorage({ driver: fsDriver({ base: dir }) }), { capacity: 2 })
    const { rows } = await restarted.read(0, 100)

    expect(rows.map(r => r.name)).toEqual(['b', 'c'])
  })
})
