import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { createStorage } from 'unstorage'
import memoryDriver from 'unstorage/drivers/memory'
import fsDriver from 'unstorage/drivers/fs'
import type { Storage } from 'unstorage'
import type { SignalInput } from '@incubrain/foundry/modules/events/runtime/types/signal'

const warn = vi.hoisted(() => vi.fn())
vi.mock('consola', () => ({
  consola: { withTag: () => ({ warn, info: vi.fn(), error: vi.fn() }) },
}))

const { createSignalBuffer, withServerRowId } = await import(
  '@incubrain/foundry/modules/events/server/utils/signal-buffer'
)

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const memory = () => createStorage({ driver: memoryDriver() })
const event = (name: string, extra: Partial<SignalInput> = {}): SignalInput => ({
  kind: 'event',
  name,
  site: 'test-site',
  ...extra,
})

/** A storage whose writes can be made to fail on demand, to exercise the error paths. */
function flaky(inner: Storage) {
  const state = { failRow: false, failMeta: false }
  const storage = new Proxy(inner, {
    get(target, prop, receiver) {
      if (prop === 'setItem') {
        return (key: string, value: unknown) => {
          if (state.failRow && key.startsWith('row:')) return Promise.reject(new Error('disk full'))
          if (state.failMeta && key === 'meta') return Promise.reject(new Error('meta write failed'))
          return target.setItem(key, value as never)
        }
      }
      return Reflect.get(target, prop, receiver)
    },
  })
  return { storage, state }
}

describe('epoch', () => {
  it('mints a uuid epoch on fresh storage', async () => {
    const { epoch } = await createSignalBuffer(memory()).snapshot()

    expect(epoch).toMatch(UUID)
  })

  it('mints a different epoch for each fresh storage (memory driver: every boot)', async () => {
    const a = await createSignalBuffer(memory()).snapshot()
    const b = await createSignalBuffer(memory()).snapshot()

    expect(a.epoch).not.toBe(b.epoch)
  })

  it('keeps one epoch for the life of a buffer', async () => {
    const buffer = createSignalBuffer(memory())
    const before = (await buffer.snapshot()).epoch
    await buffer.append(event('a'))
    await buffer.append(event('b'))

    expect((await buffer.snapshot()).epoch).toBe(before)
    expect((await buffer.identity()).epoch).toBe(before)
  })

  it('persists the epoch in meta alongside head and oldest', async () => {
    const storage = memory()
    const buffer = createSignalBuffer(storage)
    await buffer.append(event('a'))
    const { epoch } = await buffer.snapshot()

    expect(await storage.getItem('meta')).toEqual({ head: 1, oldest: 1, epoch })
  })

  it('hands one epoch to concurrent first callers', async () => {
    const buffer = createSignalBuffer(memory())

    const [snap, ident, row] = await Promise.all([
      buffer.snapshot(),
      buffer.identity(),
      buffer.append(event('a')),
    ])

    expect(snap.epoch).toBe(ident.epoch)
    expect(row.seq).toBe(1)
  })

  describe('on the fs driver', () => {
    let dir: string
    const fs = () => createStorage({ driver: fsDriver({ base: dir }) })

    afterEach(() => {
      if (dir) rmSync(dir, { recursive: true, force: true })
    })

    it('survives a restart: storage that keeps meta keeps the epoch', async () => {
      dir = mkdtempSync(join(tmpdir(), 'foundry-signal-epoch-'))

      const first = createSignalBuffer(fs(), { driver: 'fs' })
      await first.append(event('a'))
      const { epoch } = await first.snapshot()

      const restarted = createSignalBuffer(fs(), { driver: 'fs' })
      const row = await restarted.append(event('b'))

      expect((await restarted.snapshot()).epoch).toBe(epoch)
      expect(row.seq).toBe(2)
    })

    it('keeps the epoch when it was only read, never appended to', async () => {
      dir = mkdtempSync(join(tmpdir(), 'foundry-signal-epoch-'))

      const { epoch } = await createSignalBuffer(fs()).snapshot()

      expect((await createSignalBuffer(fs()).snapshot()).epoch).toBe(epoch)
    })

    it('mints a new epoch once the storage is fresh again (volume wiped)', async () => {
      dir = mkdtempSync(join(tmpdir(), 'foundry-signal-epoch-'))
      const { epoch } = await createSignalBuffer(fs()).snapshot()
      rmSync(dir, { recursive: true, force: true })
      dir = mkdtempSync(join(tmpdir(), 'foundry-signal-epoch-'))

      expect((await createSignalBuffer(fs()).snapshot()).epoch).not.toBe(epoch)
    })

    it('adopts meta written before epochs existed, keeping head and oldest', async () => {
      dir = mkdtempSync(join(tmpdir(), 'foundry-signal-epoch-'))
      const legacy = fs()
      await legacy.setItem('meta', { head: 7, oldest: 3 })
      await legacy.setItem('row:7', { id: 'x', seq: 7, ts: 1, site: 's', kind: 'event', name: 'old' })

      const buffer = createSignalBuffer(fs())
      const { epoch, meta } = await buffer.snapshot()

      expect(epoch).toMatch(UUID)
      expect(meta.headSeq).toBe(7)
      expect((await buffer.append(event('next'))).seq).toBe(8)
      expect((await createSignalBuffer(fs()).snapshot()).epoch).toBe(epoch)
    })

    it('does not re-issue a seq whose row landed but whose meta write was lost', async () => {
      dir = mkdtempSync(join(tmpdir(), 'foundry-signal-epoch-'))
      const first = createSignalBuffer(fs())
      await first.append(event('a'))
      // Simulate a crash between `row:2` being written and `meta` catching up.
      await fs().setItem('row:2', { id: 'late', seq: 2, ts: 1, site: 's', kind: 'event', name: 'b' })

      const restarted = createSignalBuffer(fs())
      const row = await restarted.append(event('c'))

      expect(row.seq).toBe(3)
      const { rows } = await restarted.read(0, 10)
      expect(rows.map(r => r.name)).toEqual(['a', 'b', 'c'])
    })
  })
})

describe('snapshot().meta', () => {
  it('describes an empty buffer', async () => {
    const { meta } = await createSignalBuffer(memory()).snapshot()

    expect(meta).toEqual({
      driver: 'memory',
      rows: 0,
      headSeq: 0,
      oldestSeq: null,
      oldestTs: null,
      capacity: 170_000,
      retentionDays: 14,
      evictedSinceBoot: 0,
    })
  })

  it('reports the driver it was given', async () => {
    const { meta } = await createSignalBuffer(memory(), { driver: 'fs' }).snapshot()

    expect(meta.driver).toBe('fs')
  })

  it('tracks head, oldest and the oldest row timestamp', async () => {
    const buffer = createSignalBuffer(memory())
    await buffer.append(event('a', { ts: Date.now() - 1000 }))
    await buffer.append(event('b'))

    const { meta } = await buffer.snapshot()

    expect(meta.rows).toBe(2)
    expect(meta.headSeq).toBe(2)
    expect(meta.oldestSeq).toBe(1)
    expect(meta.oldestTs).toBeLessThan(Date.now() - 900)
    expect(meta.evictedSinceBoot).toBe(0)
  })

  it('counts capacity evictions and moves oldest forward', async () => {
    const buffer = createSignalBuffer(memory(), { capacity: 3 })
    for (const name of ['a', 'b', 'c', 'd', 'e']) await buffer.append(event(name))

    const { meta } = await buffer.snapshot()

    expect(meta).toMatchObject({ rows: 3, headSeq: 5, oldestSeq: 3, capacity: 3, evictedSinceBoot: 2 })
  })

  it('counts retention evictions', async () => {
    const buffer = createSignalBuffer(memory(), { retentionMs: 1000 })
    await buffer.append(event('stale', { ts: Date.now() - 5000 }))
    await buffer.append(event('fresh'))

    const { meta } = await buffer.snapshot()

    expect(meta).toMatchObject({ rows: 1, oldestSeq: 2, evictedSinceBoot: 1 })
  })

  it('reports retentionDays as 0 when time-based pruning is off', async () => {
    const { meta } = await createSignalBuffer(memory(), { retentionMs: 0 }).snapshot()

    expect(meta.retentionDays).toBe(0)
  })

  it('resets evictedSinceBoot on a restart — it is a per-process counter', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'foundry-signal-epoch-'))
    try {
      const fs = () => createStorage({ driver: fsDriver({ base: dir }) })
      const first = createSignalBuffer(fs(), { capacity: 2 })
      for (const name of ['a', 'b', 'c']) await first.append(event(name))
      expect((await first.snapshot()).meta.evictedSinceBoot).toBe(1)

      const restarted = createSignalBuffer(fs(), { capacity: 2 })
      expect((await restarted.snapshot()).meta).toMatchObject({ evictedSinceBoot: 0, oldestSeq: 2, headSeq: 3 })
    }
    finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('seq integrity', () => {
  it('a failed row write consumes no seq, so no hole', async () => {
    const { storage, state } = flaky(memory())
    const buffer = createSignalBuffer(storage)
    await buffer.append(event('a'))

    state.failRow = true
    await expect(buffer.append(event('lost'))).rejects.toThrow('disk full')
    state.failRow = false
    const row = await buffer.append(event('b'))

    expect(row.seq).toBe(2)
    const { rows } = await buffer.read(0, 10)
    expect(rows.map(r => r.seq)).toEqual([1, 2])
  })

  it('a failed meta write does not reject an append whose row is stored, and is logged', async () => {
    warn.mockClear()
    const { storage, state } = flaky(memory())
    const buffer = createSignalBuffer(storage)
    await buffer.append(event('a'))

    state.failMeta = true
    const row = await buffer.append(event('b'))
    state.failMeta = false

    expect(row.seq).toBe(2)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('housekeeping failed after seq 2'))
    expect((await buffer.append(event('c'))).seq).toBe(3)
  })
})

describe('withServerRowId', () => {
  it('drops the caller id and keeps it as data.clientId', () => {
    const out = withServerRowId(event('section_view', { id: 'section_view_hero', data: { location: 'hero' } }))

    expect(out).not.toHaveProperty('id')
    expect(out.data).toEqual({ location: 'hero', clientId: 'section_view_hero' })
  })

  it('creates data when the caller sent none', () => {
    expect(withServerRowId(event('x', { id: 'abc' })).data).toEqual({ clientId: 'abc' })
  })

  it('leaves a row with no id untouched', () => {
    const input = event('x', { data: { a: 1 } })

    expect(withServerRowId(input)).toEqual(input)
    expect(withServerRowId(input)).not.toHaveProperty('data.clientId')
  })

  it('gives repeats of one client id distinct row ids (the Polaris dedupe-drop bug)', async () => {
    const buffer = createSignalBuffer(memory())
    const first = await buffer.append(withServerRowId(event('section_view', { id: 'section_view_station' })))
    const second = await buffer.append(withServerRowId(event('section_view', { id: 'section_view_station' })))

    expect(first.id).toMatch(UUID)
    expect(second.id).toMatch(UUID)
    expect(first.id).not.toBe(second.id)
    expect(first.data?.clientId).toBe('section_view_station')
  })
})
