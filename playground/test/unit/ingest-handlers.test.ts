import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import * as h3 from 'h3'
import { appendSignal } from '@incubrain/foundry/modules/events/server/utils/signal-buffer'
import { makeEvent } from './helpers/h3-event'

vi.mock('@incubrain/foundry/modules/events/server/utils/signal-buffer', () => ({
  appendSignal: vi.fn(async (row: unknown) => row),
}))

type Handler = (event: h3.H3Event) => Promise<unknown>
interface Row { name: string, ts?: number, data?: Record<string, unknown> }

let ingest: Handler
let webhook: Handler

const rows = () => vi.mocked(appendSignal).mock.calls.map(([row]) => row as Row)

/** Run a handler and return what it threw (or undefined), h3-style. */
async function thrown(handler: Handler, event: h3.H3Event): Promise<h3.H3Error | undefined> {
  try {
    await handler(event)
  }
  catch (error) {
    return error as h3.H3Error
  }
}

const post = (url: string, body: unknown, headers: Record<string, string> = {}) =>
  makeEvent({
    method: 'POST',
    url,
    headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 (Macintosh)', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })

const ingestPost = (body: unknown) => post('/api/_signals/ingest', body)
const goodRow = (extra: Record<string, unknown> = {}) => ({ kind: 'event', name: 'ui.click', ...extra })

beforeAll(async () => {
  // The handlers reach for Nitro auto-imports; hand them the real h3 ones.
  vi.stubGlobal('defineEventHandler', h3.defineEventHandler)
  vi.stubGlobal('readRawBody', h3.readRawBody)
  vi.stubGlobal('readBody', h3.readBody)
  vi.stubGlobal('createError', h3.createError)
  vi.stubGlobal('getHeader', h3.getHeader)

  ingest = (await import('@incubrain/foundry/modules/events/server/handlers/signals-ingest.post')).default as unknown as Handler
  webhook = (await import('@incubrain/foundry/modules/events/server/handlers/webhook.post')).default as unknown as Handler
})

beforeEach(() => {
  vi.mocked(appendSignal).mockClear()
})

describe('POST /api/_signals/ingest — rejections', () => {
  it('returns 400, never 500, for a body that is not JSON', async () => {
    const error = await thrown(ingest, ingestPost('{"rows": [oops'))

    expect(error?.statusCode).toBe(400)
    expect(error?.data).toEqual({ issues: ['body:invalid_json'] })
    expect(rows()).toEqual([])
  })

  it('returns 400 for a plain-text body', async () => {
    const error = await thrown(ingest, ingestPost('hello there'))

    expect(error?.statusCode).toBe(400)
  })

  it('returns 400 with path:code issues — and no field values — for a schema failure', async () => {
    const error = await thrown(ingest, ingestPost({ rows: [goodRow({ name: 'secret-value-123', kind: 'nonsense', severity: 5 })] }))

    expect(error?.statusCode).toBe(400)
    const issues = (error!.data as { issues: string[] }).issues
    expect(issues).toEqual(expect.arrayContaining(['rows.0.kind:invalid_value', 'rows.0.severity:invalid_value']))
    expect(JSON.stringify(error!.data)).not.toContain('secret-value-123')
    expect(rows()).toEqual([])
  })

  it('returns 400 for a missing body, a bare array and null', async () => {
    for (const body of ['', '[]', 'null', '{}']) {
      const error = await thrown(ingest, ingestPost(body))
      expect(error?.statusCode).toBe(400)
    }
  })

  it('returns 413 over the size cap, tagged body:too_large', async () => {
    const error = await thrown(ingest, ingestPost(JSON.stringify({ rows: [goodRow({ data: { pad: 'x'.repeat(130 * 1024) } })] })))

    expect(error?.statusCode).toBe(413)
    expect(error?.data).toEqual({ issues: ['body:too_large'] })
  })

  it('does not append a row itself on a rejection (the error hook owns that)', async () => {
    await thrown(ingest, ingestPost('not json'))
    await thrown(ingest, ingestPost({ rows: [] }))

    expect(appendSignal).not.toHaveBeenCalled()
  })
})

describe('POST /api/_signals/ingest — ts window', () => {
  const NOW = new Date('2026-06-01T12:00:00Z').getTime()
  const HOUR = 60 * 60 * 1000

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  it('keeps an in-window client ts', async () => {
    await ingest(ingestPost({ rows: [goodRow({ ts: NOW - HOUR }), goodRow({ ts: NOW + 60_000 })] }))

    expect(rows().map(row => row.ts)).toEqual([NOW - HOUR, NOW + 60_000])
  })

  it('replaces a ts older than 24h, further than 5min ahead, or absent with the server clock', async () => {
    await ingest(ingestPost({
      rows: [
        goodRow({ ts: NOW - 25 * HOUR }),
        goodRow({ ts: NOW + 6 * 60_000 }),
        goodRow({ ts: 1 }),
        goodRow(),
      ],
    }))

    expect(rows().map(row => row.ts)).toEqual([NOW, NOW, NOW, NOW])
  })

  it('leaves the rest of the row alone', async () => {
    const result = await ingest(ingestPost({ rows: [goodRow({ id: 'client-id-1', ts: 1, page: '/pricing' })] }))

    expect(result).toEqual({ accepted: 1 })
    expect(rows()[0]).toMatchObject({ id: 'client-id-1', name: 'ui.click', page: '/pricing' })
  })
})

describe('POST /api/v1/webhook', () => {
  const goodForm = { formData: { email: 'a@b.co', plan: 'pro' } }

  it('returns 400 with path:code issues for an invalid payload', async () => {
    const error = await thrown(webhook, post('/api/v1/webhook', { formData: { email: ['nested'] } }))

    expect(error?.statusCode).toBe(400)
    expect((error!.data as { issues: string[] }).issues[0]).toMatch(/^formData\.email:/)
    expect(appendSignal).not.toHaveBeenCalled()
  })

  it('returns 400, never 500, for a missing, malformed or non-object body', async () => {
    for (const body of ['', 'not json{', 'null', '"str"', '[]']) {
      const error = await thrown(webhook, post('/api/v1/webhook', body))
      expect(error?.statusCode).toBe(400)
    }
  })

  it('does not choke on a non-string honeypot', async () => {
    const error = await thrown(webhook, post('/api/v1/webhook', { ...goodForm, antiSpam: { honeypot: 7 } }))

    expect(error).toBeUndefined()
  })

  it('stamps form_submitted with the request id', async () => {
    const result = await webhook(post('/api/v1/webhook', goodForm, { 'x-request-id': 'trace-abcdef12' }))

    expect(result).toMatchObject({ success: true })
    expect(rows()).toHaveLength(1)
    expect(rows()[0]).toMatchObject({
      name: 'form_submitted',
      data: { formData: goodForm.formData, requestId: 'trace-abcdef12' },
    })
  })

  it('still silently accepts a honeypot hit without a row', async () => {
    const result = await webhook(post('/api/v1/webhook', { ...goodForm, antiSpam: { honeypot: 'gotcha' } }))

    expect(result).toMatchObject({ success: true })
    expect(appendSignal).not.toHaveBeenCalled()
  })
})
