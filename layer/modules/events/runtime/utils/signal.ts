import type { EventPayload } from '../types/events'
import { SIGNAL_TEXT_MAX, type SignalInput } from '../types/signal'

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']

/** `?polaris_review=<token>` — the review-session tag. Never merged into `utm`. */
const REVIEW_KEY = 'polaris_review'
const MAX_REVIEW = 128
const MAX_ERROR = 200

export const truncate = (value: unknown, max: number): string | undefined =>
  value === undefined || value === null ? undefined : String(value).slice(0, max)

/**
 * Page + referrer + utm + review context for the current client navigation.
 *
 * `review` is read straight off `location.search` on every call and is never
 * written to storage: only rows emitted while the tagged URL is the current one
 * carry it. That is deliberate — an external reviewer needs exactly one tagged
 * row to learn the visitor's `hash`, and persisting the tag would stamp every
 * later row on every later page instead.
 */
export function pageContext(): Pick<SignalInput, 'page' | 'referrer' | 'utm' | 'review'> {
  if (!import.meta.client) return {}

  const params = new URLSearchParams(window.location.search)
  const utm: Record<string, string> = {}
  for (const key of UTM_KEYS) {
    const value = params.get(key)
    if (value) utm[key] = value.slice(0, 256)
  }

  const review = params.get(REVIEW_KEY)?.trim()

  return {
    // Ingest rejects the whole batch if either exceeds SIGNAL_TEXT_MAX.
    page: truncate(window.location.pathname, SIGNAL_TEXT_MAX),
    referrer: truncate(document.referrer || undefined, SIGNAL_TEXT_MAX),
    utm: Object.keys(utm).length ? utm : undefined,
    review: review ? review.slice(0, MAX_REVIEW) : undefined,
  }
}

/**
 * Message text of a caught error — and nothing else. Never stringifies an
 * arbitrary object, so field values can't leak into a row through `error`.
 */
const errorMessage = (error: unknown): string | undefined => {
  const message = typeof error === 'string' ? error : (error as { message?: unknown } | null)?.message
  return typeof message === 'string' && message ? message.slice(0, MAX_ERROR) : undefined
}

/**
 * Analytics event payload → signal envelope. No `visitor`: every visitor field
 * (`hash`, `class`, …) is stamped server-side at ingest, never sent from here.
 */
export function toSignalRow(payload: EventPayload): SignalInput {
  const data = (payload.data ?? {}) as Record<string, unknown>
  const error = errorMessage(payload.error)

  return {
    id: payload.id,
    ts: payload.timestamp,
    kind: 'event',
    name: payload.type,
    ...pageContext(),
    data: {
      ...data,
      location: payload.location,
      target: payload.target,
      action: payload.action,
      ...(error && { error }),
    },
  }
}
