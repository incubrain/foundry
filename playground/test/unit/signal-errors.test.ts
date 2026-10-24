import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import * as h3 from 'h3'
import { appendSignal } from '@incubrain/foundry/modules/events/server/utils/signal-buffer'
import { resetRejectionLimiter } from '@incubrain/foundry/modules/events/server/utils/page-request'
import { makeEvent } from './helpers/h3-event'

vi.mock('@incubrain/foundry/modules/events/server/utils/signal-buffer', () => ({
  appendSignal: vi.fn(async (row: unknown) => row),
}))

interface Row { name: string, data: { message?: string, path?: string, status?: number, issues?: string[] } & Record<string, unknown> }
type ErrorHook = (error: unknown, ctx: { event?: h3.H3Event }) => void

let errorHook: ErrorHook

/** Fire the Nitro error hook with an error carrying `statusCode`, as h3 would. */
const fail = (event: h3.H3Event | undefined, statusCode: number, extra: Record<string, unknown> = {}) =>
  errorHook(h3.createError({ statusCode, statusMessage: 'boom', ...extra }), { event })

const rows = () => vi.mocked(appendSignal).mock.calls.map(([row]) => row as Row)
const names = () => rows().map(row => row.name)

beforeAll(async () => {
  // The plugin reaches for Nitro auto-imports; hand it the real h3 ones.
  vi.stubGlobal('defineNitroPlugin', (plugin: unknown) => plugin)
  vi.stubGlobal('getHeader', h3.getHeader)

  const plugin = (await import('@incubrain/foundry/modules/events/server/plugins/signal-errors')).default as unknown as
  (nitroApp: { hooks: { hook: (name: string, fn: ErrorHook) => void } }) => void
  plugin({
    hooks: {
      hook: (_name, fn) => {
        errorHook = fn
      },
    },
  })
})

beforeEach(() => {
  vi.mocked(appendSignal).mockClear()
  resetRejectionLimiter()
})

describe('error hook — 4xx never writes server_error', () => {
  it('writes no row for an unauthenticated /api/_signals/export probe (401)', () => {
    const event = makeEvent({ url: '/api/_signals/export', headers: { 'user-agent': 'Polaris/1.0' } })
    fail(event, 401)

    expect(rows()).toEqual([])
  })

  it('writes no row for 403, 405, 422 or any other 4xx', () => {
    for (const status of [400, 401, 403, 405, 409, 413, 422, 429]) {
      fail(makeEvent({ url: '/api/anything' }), status)
    }

    expect(names()).not.toContain('server_error')
  })

  it('writes no row for a 4xx with no request event', () => {
    fail(undefined, 400)
    fail(undefined, 404)

    expect(rows()).toEqual([])
  })

  it('still writes server_error for a 500, with correlation fields and a 300-char message', () => {
    const event = makeEvent({ method: 'POST', url: '/api/thing?token=abc', headers: { 'x-request-id': 'trace-abcdef12' } })
    event.context.foundryRequestId = 'trace-abcdef12'
    errorHook(Object.assign(new Error('x'.repeat(900)), { statusCode: 500 }), { event })

    expect(rows()).toHaveLength(1)
    const [row] = rows()
    expect(row).toMatchObject({
      kind: 'log',
      severity: 'error',
      name: 'server_error',
      data: { requestId: 'trace-abcdef12', method: 'POST', path: '/api/thing', status: 500, statusCode: 500 },
    })
    expect(row.data.message).toHaveLength(300)
  })

  it('treats an error without a statusCode as a 500', () => {
    const event = makeEvent({ url: '/boom' })
    errorHook(new Error('kaboom'), { event })

    expect(rows()[0]).toMatchObject({ name: 'server_error', data: { status: 500, path: '/boom' } })
  })

  it('writes server_error without request fields when there is no event', () => {
    errorHook(new Error('startup'), {})

    expect(rows()[0].data).toMatchObject({ message: 'startup' })
    expect(rows()[0].data).not.toHaveProperty('requestId')
  })
})

describe('error hook — http.not_found', () => {
  it('is unchanged: a notable 404 writes http.not_found (not server_error), stamped with requestId', () => {
    const event = makeEvent({ url: '/missing-page?utm=x', headers: { 'accept': 'text/html', 'user-agent': 'Mozilla/5.0 (Macintosh)', 'x-request-id': 'trace-abcdef12' } })
    fail(event, 404)

    expect(names()).toEqual(['http.not_found'])
    expect(rows()[0]).toMatchObject({ kind: 'event', page: '/missing-page', data: { requestId: 'trace-abcdef12' } })
  })

  it('still skips scanner probes and asset 404s', () => {
    fail(makeEvent({ url: '/wp-login.php', headers: { accept: 'text/html' } }), 404)
    fail(makeEvent({ url: '/favicon.ico' }), 404)

    expect(rows()).toEqual([])
  })
})

describe('error hook — ingest_rejected', () => {
  const rejectIngest = (statusCode = 400, extra: Record<string, unknown> = { data: { issues: ['rows:invalid_type'] } }) =>
    fail(makeEvent({ method: 'POST', url: '/api/_signals/ingest', headers: { 'x-request-id': 'trace-abcdef12' } }), statusCode, extra)

  it('writes ONE ingest_rejected row for a 400 on ingest', () => {
    rejectIngest()

    expect(rows()).toHaveLength(1)
    expect(rows()[0]).toMatchObject({
      kind: 'log',
      severity: 'warning',
      name: 'ingest_rejected',
      data: { requestId: 'trace-abcdef12', path: '/api/_signals/ingest', status: 400, issues: ['rows:invalid_type'] },
    })
  })

  it('rate-limits to 1 row per (path, status) per 60s', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
      rejectIngest()
      vi.setSystemTime(new Date('2026-01-01T00:00:30Z'))
      rejectIngest()
      rejectIngest()
      expect(rows()).toHaveLength(1)

      // a different status on the same path, and the same status on the other path, are separate buckets
      rejectIngest(413, { data: { issues: ['body:too_large'] } })
      fail(makeEvent({ method: 'POST', url: '/api/v1/webhook' }), 400)
      expect(rows()).toHaveLength(3)

      vi.setSystemTime(new Date('2026-01-01T00:01:01Z'))
      rejectIngest()
      expect(rows()).toHaveLength(4)
    }
    finally {
      vi.useRealTimers()
    }
  })

  it('covers the webhook and 413/415 too', () => {
    fail(makeEvent({ method: 'POST', url: '/api/v1/webhook' }), 400, { data: { issues: ['formData:invalid_type'] } })
    fail(makeEvent({ method: 'POST', url: '/api/v1/webhook' }), 415)
    rejectIngest(413, { data: { issues: ['body:too_large'] } })

    expect(rows().map(row => [row.data.path, row.data.status])).toEqual([
      ['/api/v1/webhook', 400],
      ['/api/v1/webhook', 415],
      ['/api/_signals/ingest', 413],
    ])
  })

  it('never writes server_error alongside it', () => {
    rejectIngest()

    expect(names()).toEqual(['ingest_rejected'])
  })

  it('writes nothing for 401/403 on the ingest endpoints', () => {
    rejectIngest(401, {})
    rejectIngest(403, {})

    expect(rows()).toEqual([])
  })

  it('ignores a 400 on any other route, and a non-POST on the ingest route', () => {
    fail(makeEvent({ method: 'POST', url: '/api/other' }), 400)
    fail(makeEvent({ method: 'GET', url: '/api/_signals/ingest' }), 400)

    expect(rows()).toEqual([])
  })

  it('carries no issues rather than guessing when the handler gave none', () => {
    rejectIngest(400, {})

    expect(rows()[0].data.issues).toEqual([])
  })
})
