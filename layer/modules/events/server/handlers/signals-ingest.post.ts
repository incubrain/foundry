import { z } from 'zod'
import { appendSignal } from '../utils/signal-buffer'
import { describeVisitor } from '../utils/visitor-class'
import { clampClientTs, zodIssueCodes } from '../utils/page-request'

// Sized for the identity-event stream (ui.click / ui.section / ui.page): the
// client batches at most `MAX_QUEUE` rows per POST (useSignalQueue.ts), so
// MAX_ROWS is that with headroom and MAX_BODY_BYTES covers 100 fat rows.
const MAX_BODY_BYTES = 128 * 1024
const MAX_ROWS = 100

const rowSchema = z.object({
  id: z.string().max(64).optional(),
  ts: z.number().optional(),
  kind: z.enum(['event', 'log']),
  name: z.string().min(1).max(64),
  severity: z.enum(['error', 'warning']).optional(),
  // No identity field: `visitor.hash` is stamped server-side by appendSignal(),
  // and zod strips anything else — including the `anonId` a stale cached
  // client may still send.
  visitor: z.object({
    // Accepted but ignored — `class`/`subclass` are always overwritten
    // server-side below, from the request UA.
    class: z.enum(['human', 'agent', 'bot']).optional(),
    subclass: z.enum(['search', 'live-user-fetch', 'training', 'automation']).optional(),
  }).optional(),
  page: z.string().max(512).optional(),
  referrer: z.string().max(512).optional(),
  utm: z.record(z.string().max(32), z.string().max(256)).optional(),
  review: z.string().max(128).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
})

const ingestSchema = z.object({
  rows: z.array(rowSchema).min(1).max(MAX_ROWS),
})

/**
 * POST /api/_signals/ingest — client-originated rows (events + client errors).
 * Size-capped, zod-validated, appended to the signal buffer.
 *
 * Refusals throw `createError` and never append: the Nitro error hook
 * (`plugins/signal-errors.ts`) writes the one `ingest_rejected` row from
 * `data.issues` (zod `path:code` strings — never field values). A client error
 * is a 4xx, not a crash: a body that isn't JSON is a 400, never a 500.
 */
export default defineEventHandler(async (event) => {
  const raw = await readRawBody(event)
  if (raw && raw.length > MAX_BODY_BYTES) {
    throw createError({
      statusCode: 413,
      statusMessage: `Signal payload too large: ${raw.length} bytes, limit is ${MAX_BODY_BYTES}`,
      data: { issues: ['body:too_large'] },
    })
  }

  let body: unknown = {}
  if (raw) {
    try {
      body = JSON.parse(raw.toString())
    }
    catch {
      throw createError({
        statusCode: 400,
        statusMessage: 'Signal ingest body is not valid JSON',
        data: { issues: ['body:invalid_json'] },
      })
    }
  }

  const parsed = ingestSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: `Signal ingest validation failed: ${parsed.error.issues.map((issue: { message: string }) => issue.message).join(', ')}`,
      data: { issues: zodIssueCodes(parsed.error.issues) },
    })
  }

  // Classify once per request — client-supplied `visitor.class`/`subclass` are
  // never trusted. `subclass` is spread last so an agent matched only by a
  // vendor hint clears any client-sent value rather than inheriting it.
  const visitor = describeVisitor(getHeader(event, 'user-agent'))

  const now = Date.now()

  for (const row of parsed.data.rows) {
    await appendSignal({
      ...row,
      // The buffer's retention prune assumes roughly chronological `ts`; a
      // client clock far off (or a forged one) is replaced with the server's.
      ts: clampClientTs(row.ts, now),
      visitor: { ...row.visitor, class: visitor.class, subclass: visitor.subclass },
    }, event)
  }

  return { accepted: parsed.data.rows.length }
})
