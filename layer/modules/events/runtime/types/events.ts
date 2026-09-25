// Offer IDs from content
export type OfferId = 'payment' | 'booking' | 'service' | 'social' | 'apply'
export type OfferExternal = `${OfferId}_external`
export type OfferInternal = `${OfferId}_internal`
export type OfferTarget = OfferExternal | OfferInternal

export type TrackedEvents
  = | 'form_submitted'
    | 'form_error'
    | 'offer_click'
    | 'section_view'
    // Always-on, content-free identity stream — see runtime/utils/identity.ts.
    | 'ui.click'
    | 'ui.section'
    | 'ui.page'
    | 'ui.outbound'

export type EventTarget = OfferTarget

/**
 * Base fields that exist on ALL events
 */
export interface BaseEventPayload {
  id: string
  userId?: string
  timestamp: number
  action?: string // Optional in new system?
  location?: string
  target?: string
}

/**
 * Fields added during event processing
 */
export interface ProcessedEventFields {
  response?: unknown
  error?: unknown
  _devToolsTriggered?: boolean
}

export interface FormSubmittedPayload
  extends BaseEventPayload, ProcessedEventFields {
  type: 'form_submitted'
  target: string
  data: {
    formData: Record<string, unknown>
    antiSpam?: unknown
  }
}

export interface FormErrorPayload
  extends BaseEventPayload, ProcessedEventFields {
  type: 'form_error'
  target: string
  error: unknown
  data?: Record<string, unknown>
}

export interface GenericEventPayload
  extends BaseEventPayload, ProcessedEventFields {
  type: TrackedEvents
  data?: Record<string, unknown>
}

export type EventPayload
  = | GenericEventPayload
    | FormSubmittedPayload
    | FormErrorPayload

export interface ModuleOptions {
  /** Signal capture: ring buffer + `/api/_signals/*` endpoints. */
  signals: {
    enabled: boolean
    /** Max rows held in the ring buffer before the oldest are evicted. */
    capacity: number
    /** Capture client + server errors as `kind: 'log'` rows. */
    captureErrors: boolean
  }
  /** Echo every tracked event to the browser console. */
  debug: boolean
}

/**
 * Input type for trackEvent() — requires `type`, auto-fills `id` and `timestamp`
 */
export type TrackEventInput = Pick<EventPayload, 'type'> & Partial<Omit<EventPayload, 'type'>>

export interface EventsHooks {
  'events:track': (payload: EventPayload) => void | Promise<void>
  'events:dev': (
    payload: EventPayload & {
      _devStatus: 'success' | 'error'
    },
  ) => void
}
