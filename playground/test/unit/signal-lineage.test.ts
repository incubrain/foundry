import { describe, it, expect } from 'vitest'
import { createStorage } from 'unstorage'
import memoryDriver from 'unstorage/drivers/memory'
import { createSignalBuffer } from '@incubrain/foundry/modules/events/server/utils/signal-buffer'
import { buildExportResponse } from '@incubrain/foundry/modules/events/server/utils/signal-export'
import { buildBootReport } from '@incubrain/foundry/modules/events/server/utils/boot-report'
import type { BootReportInput } from '@incubrain/foundry/modules/events/server/utils/boot-report'
import { buildHealthPayload } from '@incubrain/foundry/server/utils/health'

const memory = () => createStorage({ driver: memoryDriver() })

describe('export response', () => {
  it('keeps rows/cursor/site and adds epoch + meta', async () => {
    const buffer = createSignalBuffer(memory(), { driver: 'fs', capacity: 10 })
    await buffer.append({ kind: 'event', name: 'a', site: 's' })
    await buffer.append({ kind: 'event', name: 'b', site: 's' })

    const body = buildExportResponse(await buffer.read(0, 10), 'incubrain.org', await buffer.snapshot())

    expect(Object.keys(body).sort()).toEqual(['cursor', 'epoch', 'meta', 'rows', 'site'])
    expect(body.site).toBe('incubrain.org')
    expect(body.cursor).toBe(2)
    expect(body.rows.map(r => r.name)).toEqual(['a', 'b'])
    expect(body.epoch).toMatch(/^[0-9a-f-]{36}$/)
    expect(Object.keys(body.meta).sort()).toEqual([
      'capacity',
      'driver',
      'evictedSinceBoot',
      'headSeq',
      'oldestSeq',
      'oldestTs',
      'retentionDays',
      'rows',
    ])
    expect(body.meta).toMatchObject({
      driver: 'fs',
      rows: 2,
      headSeq: 2,
      oldestSeq: 1,
      capacity: 10,
      retentionDays: 14,
      evictedSinceBoot: 0,
    })
    expect(typeof body.meta.oldestTs).toBe('number')
  })

  it('reports the same epoch on every page of one buffer', async () => {
    const buffer = createSignalBuffer(memory())
    await buffer.append({ kind: 'event', name: 'a', site: 's' })

    const one = buildExportResponse(await buffer.read(0, 1), 's', await buffer.snapshot())
    const two = buildExportResponse(await buffer.read(1, 1), 's', await buffer.snapshot())

    expect(one.epoch).toBe(two.epoch)
  })
})

describe('buildHealthPayload — signals + buildId', () => {
  const now = new Date('2026-01-01T00:00:00.000Z')

  it('adds buildId and signals{driver, epoch} without touching the original keys', () => {
    const payload = buildHealthPayload('0.9.0', 'my-site', now, {
      buildId: 'abc123',
      signals: { driver: 'fs', epoch: 'e-1' },
    })

    expect(payload).toEqual({
      ok: true,
      service: 'foundry',
      version: '0.9.0',
      siteId: 'my-site',
      timestamp: '2026-01-01T00:00:00.000Z',
      buildId: 'abc123',
      signals: { driver: 'fs', epoch: 'e-1' },
    })
  })

  it('carries lineage only — no row counts or sequence numbers', () => {
    const payload = buildHealthPayload('0.9.0', 'my-site', now, {
      buildId: 'abc123',
      signals: { driver: 'memory', epoch: 'e-1' },
    })

    expect(Object.keys(payload.signals ?? {}).sort()).toEqual(['driver', 'epoch'])
  })

  it('omits signals when capture is disabled and reports a missing buildId as null', () => {
    const payload = buildHealthPayload('0.9.0', undefined, now, { buildId: undefined })

    expect(payload).not.toHaveProperty('signals')
    expect(payload).not.toHaveProperty('buildId')
    expect(buildHealthPayload('0.9.0', undefined, now, { buildId: null }).buildId).toBeNull()
    expect(buildHealthPayload('0.9.0', undefined, now, { buildId: '' }).buildId).toBeNull()
  })

  it('degrades to a null epoch rather than failing', () => {
    const payload = buildHealthPayload('0.9.0', 's', now, { signals: { driver: 'unknown', epoch: null } })

    expect(payload.signals).toEqual({ driver: 'unknown', epoch: null })
  })
})

describe('buildBootReport', () => {
  const base: BootReportInput = {
    version: '0.9.0',
    buildId: 'build-1',
    siteId: 'incubrain.org',
    driver: 'fs',
    dir: '/data/signals',
    capacity: 170_000,
    retentionDays: 14,
    exportTokenSet: true,
    envMarker: undefined,
    epoch: 'epoch-1',
    production: true,
  }

  it('writes one line with version, site, driver+dir, capacity, retention, token and env marker', () => {
    const { line } = buildBootReport(base)

    expect(line).not.toContain('\n')
    expect(line).toContain('v0.9.0')
    expect(line).toContain('site=incubrain.org')
    expect(line).toContain('driver=fs(/data/signals)')
    expect(line).toContain('capacity=170000')
    expect(line).toContain('retention=14d')
    expect(line).toContain('exportToken=yes')
    expect(line).toContain('env=none')
    expect(line).toContain('epoch=epoch-1')
  })

  it('spells out an unset site, a missing token and the local env marker', () => {
    const { line } = buildBootReport({ ...base, siteId: undefined, exportTokenSet: false, envMarker: 'local', driver: 'memory', dir: undefined })

    expect(line).toContain('site=UNSET')
    expect(line).toContain('driver=memory')
    expect(line).toContain('exportToken=no')
    expect(line).toContain('env=local')
  })

  it('stays quiet in production when nothing is misconfigured', () => {
    expect(buildBootReport(base).warnings).toEqual([])
  })

  it('warns once per misconfiguration in production', () => {
    const { warnings } = buildBootReport({ ...base, siteId: undefined, driver: 'memory', dir: undefined, exportTokenSet: false })

    expect(warnings).toHaveLength(3)
    expect(warnings[0]).toContain('NUXT_PUBLIC_SITE_ID')
    expect(warnings[1]).toContain('NUXT_SIGNAL_STORE_DIR')
    expect(warnings[2]).toContain('NUXT_SIGNAL_EXPORT_TOKEN')
  })

  it('warns for each fault on its own', () => {
    expect(buildBootReport({ ...base, siteId: '' }).warnings).toHaveLength(1)
    expect(buildBootReport({ ...base, driver: 'memory' }).warnings).toHaveLength(1)
    expect(buildBootReport({ ...base, exportTokenSet: false }).warnings).toHaveLength(1)
  })

  it('never warns outside production', () => {
    const { warnings } = buildBootReport({ ...base, production: false, siteId: undefined, driver: 'memory', exportTokenSet: false })

    expect(warnings).toEqual([])
  })

  it('builds the site_booted Site Event with exactly the lineage fields', () => {
    const { row } = buildBootReport(base)

    expect(row).toEqual({
      kind: 'log',
      name: 'site_booted',
      severity: 'info',
      data: {
        version: '0.9.0',
        buildId: 'build-1',
        driver: 'fs',
        epoch: 'epoch-1',
        siteIdSet: true,
        exportTokenSet: true,
      },
    })
  })

  it('records configuration flags, never the secrets themselves', () => {
    const { row } = buildBootReport({ ...base, siteId: undefined, exportTokenSet: false })

    expect(row.data).toMatchObject({ siteIdSet: false, exportTokenSet: false })
    expect(JSON.stringify(row)).not.toContain('incubrain.org')
  })

  it('appends as a readable log row through the buffer', async () => {
    const buffer = createSignalBuffer(memory())
    const stored = await buffer.append({ ...buildBootReport(base).row, site: 'incubrain.org' })
    const { rows } = await buffer.read(0, 10)

    expect(stored.seq).toBe(1)
    expect(rows[0]).toMatchObject({ kind: 'log', name: 'site_booted', severity: 'info', data: { epoch: 'epoch-1' } })
  })
})
