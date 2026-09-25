import type { EventPayload } from '../types/events'
import type { SignalInput } from '../types/signal'

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']

/** `?polaris_review=<token>` — the review-session tag. Never merged into `utm`. */
const REVIEW_KEY = 'polaris_review'
const MAX_REVIEW = 128

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
    page: window.location.pathname,
    referrer: document.referrer || undefined,
    utm: Object.keys(utm).length ? utm : undefined,
    review: review ? review.slice(0, MAX_REVIEW) : undefined,
  }
}

/**
 * Analytics event payload → signal envelope. No `visitor`: every visitor field
 * (`hash`, `class`, …) is stamped server-side at ingest, never sent from here.
 */
export function toSignalRow(payload: EventPayload): SignalInput {
  const data = (payload.data ?? {}) as Record<string, unknown>

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
    },
  }
}
