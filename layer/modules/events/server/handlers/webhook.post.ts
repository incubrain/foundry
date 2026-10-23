import { z } from 'zod'
import { appendSignal } from '../utils/signal-buffer'
import { describeVisitor } from '../utils/visitor-class'
import { ensureRequestId, zodIssueCodes } from '../utils/page-request'

// Strict schema matching FieldDef types from useFormCapture
const captureSchema = z.object({
  formData: z.record(z.string(), z.union([
    z.string(),
    z.number(),
    z.boolean(),
  ])),
  antiSpam: z.object({
    honeypot: z.string().optional(),
    timeOnForm: z.number().optional(),
    jsToken: z.string().optional(),
  }).optional(),
})

// Minimum time (ms) a real human takes to fill the form
const MIN_FORM_TIME_MS = 2000

export default defineEventHandler(async (event) => {
  // A missing, malformed or non-object body falls through to schema validation
  // below (→ 400) instead of a destructuring TypeError (→ 500).
  const body = await readBody(event).catch(() => undefined)
  const { formData, antiSpam } = (body && typeof body === 'object' ? body : {}) as { formData?: unknown, antiSpam?: { honeypot?: unknown, timeOnForm?: unknown } }

  // === MINIMAL ANTI-SPAM CHECK ===
  // Honeypot filled in, or submitted faster than a human could type => bot.
  const isHoneypot = typeof antiSpam?.honeypot === 'string' && antiSpam.honeypot.trim() !== ''
  const isTooFast = typeof antiSpam?.timeOnForm === 'number' && antiSpam.timeOnForm < MIN_FORM_TIME_MS

  if (isHoneypot || isTooFast) {
    // Pretend success so bots don't learn they were caught
    return {
      success: true,
      message: 'Thanks! Check your email.',
    }
  }

  // === PAYLOAD VALIDATION ===

  const parsed = captureSchema.safeParse({ formData })

  if (!parsed.success) {
    // Thrown errors are picked up by the Nitro error hook, which writes the one
    // `ingest_rejected` row from `data.issues` (path:code only, never field
    // values) — don't append one here too.
    throw createError({
      statusCode: 400,
      statusMessage: `Form capture validation failed: ${parsed.error.issues.map((e: { message: string }) => e.message).join(', ')}`,
      data: { issues: zodIssueCodes(parsed.error.issues) },
    })
  }

  // === SIGNAL BUFFER (what Polaris pulls) ===

  await appendSignal({
    kind: 'event',
    name: 'form_submitted',
    visitor: describeVisitor(getHeader(event, 'user-agent')),
    data: { formData: parsed.data.formData, requestId: ensureRequestId(event) },
  }, event)

  return {
    success: true,
    message: 'Thanks! Check your email.',
  }
})
