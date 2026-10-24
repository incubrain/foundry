import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import * as h3 from 'h3'
import {
  allowRejectionRow,
  capturePageRequest,
  clampClientTs,
  ensureRequestId,
  isIngestRejection,
  readRejectionIssues,
  resetRejectionLimiter,
  resolveRequestId,
  zodIssueCodes,
} from '@incubrain/foundry/modules/events/server/utils/page-request'
import { captureMcpToolCall } from '@incubrain/foundry/server/utils/mcp-signal'
import { appendSignal } from '@incubrain/foundry/modules/events/server/utils/signal-buffer'
import { makeEvent } from './helpers/h3-event'

vi.mock('@incubrain/foundry/modules/events/server/utils/signal-buffer', () => ({
  appendSignal: vi.fn(async (row: unknown) => row),
}))

const appended = () => vi.mocked(appendSignal).mock.calls.map(([row]) => row)

let middleware: (event: h3.H3Event) => void

beforeAll(async () => {
  // The middleware and `captureMcpToolCall` reach for Nitro's auto-imports.
  vi.stubGlobal('getHeader', h3.getHeader)
  vi.stubGlobal('defineEventHandler', h3.defineEventHandler)

  middleware = (await import('@incubrain/foundry/modules/events/server/middleware/page-request')).default as unknown as typeof middleware
})

beforeEach(() => {
  vi.mocked(appendSignal).mockClear()
})

describe('resolveRequestId', () => {
  it('keeps a well-formed incoming id', () => {
    expect(resolveRequestId('req-1234.abc_XYZ')).toBe('req-1234.abc_XYZ')
    expect(resolveRequestId('a'.repeat(64))).toBe('a'.repeat(64))
  })

  it('replaces a missing, short, long or unsafe id with a fresh uuid', () => {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    for (const bad of [undefined, null, '', 'short', 'a'.repeat(65), 'has space in it', 'new\nline-12345', 'semi;colon-1234', '<script>alert1</script>']) {
      expect(resolveRequestId(bad)).toMatch(uuid)
    }
  })
})

describe('ensureRequestId', () => {
  it('echoes a valid incoming x-request-id on the response and the context', () => {
    const event = makeEvent({ headers: { 'x-request-id': 'trace-abcdef12' } })

    expect(ensureRequestId(event)).toBe('trace-abcdef12')
    expect(event.context.foundryRequestId).toBe('trace-abcdef12')
    expect(h3.getResponseHeader(event, 'x-request-id')).toBe('trace-abcdef12')
  })

  it('generates one when none (or an invalid one) arrives, and sets the header', () => {
    const event = makeEvent({ headers: { 'x-request-id': 'no good!' } })
    const id = ensureRequestId(event)

    expect(id).not.toBe('no good!')
    expect(h3.getResponseHeader(event, 'x-request-id')).toBe(id)
  })

  it('is idempotent — the first caller wins, later callers reuse it', () => {
    const event = makeEvent()

    expect(ensureRequestId(event)).toBe(ensureRequestId(event))
  })

  it('never throws once headers are flushed, and still returns an id', () => {
    const event = makeEvent()
    event.node.res.setHeader = () => {
      throw new Error('ERR_HTTP_HEADERS_SENT')
    }

    expect(() => ensureRequestId(event)).not.toThrow()
    expect(typeof event.context.foundryRequestId).toBe('string')
  })
})

describe('page-request middleware', () => {
  it('assigns and echoes a request id on every request, not only document GETs', () => {
    for (const [method, url] of [['GET', '/pricing'], ['POST', '/api/_signals/ingest'], ['POST', '/mcp'], ['GET', '/_nuxt/entry.js']] as const) {
      const event = makeEvent({ method, url, headers: { 'x-request-id': 'trace-abcdef12' } })
      middleware(event)

      expect(event.context.foundryRequestId).toBe('trace-abcdef12')
      expect(h3.getResponseHeader(event, 'x-request-id')).toBe('trace-abcdef12')
    }
  })

  it('generates an id when none arrives, and writes page_request only for document GETs', () => {
    const doc = makeEvent({ url: '/pricing', headers: { accept: 'text/html' } })
    const api = makeEvent({ method: 'POST', url: '/api/_signals/ingest' })
    middleware(doc)
    middleware(api)

    expect(typeof api.context.foundryRequestId).toBe('string')
    expect(appended()).toHaveLength(1)
    expect(appended()[0]).toMatchObject({ name: 'page_request', data: { requestId: doc.context.foundryRequestId } })
  })
})

describe('request id stamping on rows', () => {
  it('stamps data.requestId on page_request rows', () => {
    const event = makeEvent({ url: '/pricing', headers: { 'x-request-id': 'trace-abcdef12', 'accept': 'text/html' } })
    capturePageRequest(event)

    expect(appended()).toHaveLength(1)
    expect(appended()[0]).toMatchObject({ name: 'page_request', data: { requestId: 'trace-abcdef12' } })
  })

  it('stamps data.requestId on mcp_tool_called rows, sharing the request\'s id', () => {
    const event = makeEvent({ method: 'POST', url: '/mcp', headers: { 'x-request-id': 'trace-abcdef12' } })
    captureMcpToolCall('get-page', { path: '/a' }, event)

    expect(appended()[0]).toMatchObject({
      name: 'mcp_tool_called',
      data: { tool: 'get-page', requestId: 'trace-abcdef12' },
    })
  })

  it('omits requestId on mcp_tool_called when there is no request', () => {
    captureMcpToolCall('get-page', { path: '/a' })

    expect((appended()[0] as { data: Record<string, unknown> }).data).not.toHaveProperty('requestId')
  })
})

describe('clampClientTs', () => {
  const now = 1_800_000_000_000
  const HOUR = 60 * 60 * 1000

  it('keeps a ts inside [now-24h, now+5min]', () => {
    expect(clampClientTs(now - 23 * HOUR, now)).toBe(now - 23 * HOUR)
    expect(clampClientTs(now + 60_000, now)).toBe(now + 60_000)
    expect(clampClientTs(now - 24 * HOUR, now)).toBe(now - 24 * HOUR)
    expect(clampClientTs(now + 5 * 60_000, now)).toBe(now + 5 * 60_000)
  })

  it('replaces a ts outside the window with the server clock', () => {
    expect(clampClientTs(now - 24 * HOUR - 1, now)).toBe(now)
    expect(clampClientTs(now + 5 * 60_000 + 1, now)).toBe(now)
    expect(clampClientTs(0, now)).toBe(now)
    expect(clampClientTs(Number.POSITIVE_INFINITY, now)).toBe(now)
    expect(clampClientTs(Number.NaN, now)).toBe(now)
  })

  it('fills a missing ts with the server clock', () => {
    expect(clampClientTs(undefined, now)).toBe(now)
  })
})

describe('ingest rejection helpers', () => {
  beforeEach(resetRejectionLimiter)

  it('matches only a POST 400/413/415 on the two capture endpoints', () => {
    expect(isIngestRejection('POST', '/api/_signals/ingest', 400)).toBe(true)
    expect(isIngestRejection('POST', '/api/v1/webhook', 413)).toBe(true)
    expect(isIngestRejection('post', '/api/v1/webhook', 415)).toBe(true)
    expect(isIngestRejection('GET', '/api/_signals/ingest', 400)).toBe(false)
    expect(isIngestRejection('POST', '/api/_signals/export', 400)).toBe(false)
    expect(isIngestRejection('POST', '/api/_signals/ingest', 401)).toBe(false)
    expect(isIngestRejection('POST', '/api/_signals/ingest', 403)).toBe(false)
    expect(isIngestRejection('POST', '/api/_signals/ingest', 500)).toBe(false)
  })

  it('allows one row per (path, status) per 60s', () => {
    expect(allowRejectionRow('/api/_signals/ingest', 400, 1_000)).toBe(true)
    expect(allowRejectionRow('/api/_signals/ingest', 400, 30_000)).toBe(false)
    expect(allowRejectionRow('/api/_signals/ingest', 400, 60_999)).toBe(false)
    expect(allowRejectionRow('/api/_signals/ingest', 400, 61_000)).toBe(true)
  })

  it('rate-limits each (path, status) pair independently', () => {
    expect(allowRejectionRow('/api/_signals/ingest', 400, 1_000)).toBe(true)
    expect(allowRejectionRow('/api/_signals/ingest', 413, 1_000)).toBe(true)
    expect(allowRejectionRow('/api/v1/webhook', 400, 1_000)).toBe(true)
  })

  it('renders zod issues as path:code, capped at 10, never a value', () => {
    const issues = Array.from({ length: 14 }, (_, i) => ({ path: ['rows', i, 'name'], code: 'too_small' }))
    const out = zodIssueCodes(issues)

    expect(out).toHaveLength(10)
    expect(out[0]).toBe('rows.0.name:too_small')
    expect(zodIssueCodes([{ path: [], code: 'invalid_type' }])).toEqual([':invalid_type'])
    expect(zodIssueCodes([{ path: ['a', Symbol('k')], code: 'x' }])[0]).toBe('a.Symbol(k):x')
  })

  it('re-validates handler-supplied issues before they reach a row', () => {
    expect(readRejectionIssues(undefined)).toEqual([])
    expect(readRejectionIssues({ issues: 'nope' })).toEqual([])
    expect(readRejectionIssues({ issues: ['a:b', 5, null, 'c:d'] })).toEqual(['a:b', 'c:d'])
    expect(readRejectionIssues({ issues: Array.from({ length: 20 }, () => 'x:y') })).toHaveLength(10)
    expect(readRejectionIssues({ issues: ['z'.repeat(500)] })[0]).toHaveLength(100)
  })
})
