// shared/types/events.d.ts
import type { HookResult } from '@nuxt/schema';
import type { SectionId } from '#shared/config/navigation';

// Offer IDs from content
export type OfferId = 'payment' | 'booking' | 'service' | 'social' | 'rss';
export type OfferExternal = `${OfferId}_external`
export type OfferInternal = `${OfferId}_internal`
export type OfferTarget = OfferExternal | OfferInternal;

declare global {
  /**
   * Tracked event types - strictly defined
   */
  type TrackedEvents =
    | 'form_submitted'
    | 'form_error'
    | 'offer_click'
    | 'section_view';

  /**
   * All possible event targets (used for analytics grouping)
   */
  type EventTarget = SectionId | OfferTarget;
}

/**
 * Anti-spam validation data for form submissions
 */
interface AntiSpamData {
  honeypot?: string;
  timeOnForm?: number;
  jsToken?: string;
  turnstileToken?: string;
}

/**
 * Base fields that exist on ALL events
 */
interface BaseEventPayload {
  id: string;
  userId: string;
  timestamp: number; // ✅ Always required (added by useEvents)
}

/**
 * Fields added during event processing
 */
interface ProcessedEventFields {
  response?: Record<string, any>; // Added by handlers
  error?: any; // Added on handler failure
  _devToolsTriggered?: boolean; // Dev mode flag
}

/**
 * Form submission event payload
 */
export interface FormSubmittedPayload extends BaseEventPayload, ProcessedEventFields {
  type: 'form_submitted';
  target: OfferInternal;
  data: {
    formData: Record<string, any>; // Dynamic form fields
    antiSpam: AntiSpamData;
  };
}

/**
 * Form error event payload
 */
export interface FormErrorPayload extends BaseEventPayload, ProcessedEventFields {
  type: 'form_error';
  target: OfferInternal;
  data: {
    formId: string; // ✅ Flattened - no nested formData
  };
  error: any; // ✅ Required on error events
}

/**
 * Offer click event payload
 */
export interface OfferClickPayload extends BaseEventPayload, ProcessedEventFields {
  type: 'offer_click';
  target: OfferTarget;
  data?: Record<string, any>; // ✅ Optional metadata
}

/**
 * Section view event payload
 */
export interface SectionViewPayload extends BaseEventPayload, ProcessedEventFields {
  type: 'section_view';
  target: SectionId;
  data?: Record<string, any>; // ✅ Optional metadata
}

/**
 * Discriminated union of all event payloads
 */
export type EventPayload =
  | FormSubmittedPayload
  | FormErrorPayload
  | OfferClickPayload
  | SectionViewPayload;

/**
 * Event payload without auto-added fields (for composable input)
 */
export type EventInput = Omit<EventPayload, 'userId' | 'timestamp'>;

declare module '#app' {
  interface RuntimeNuxtHooks {
    'events:emit': (payload: EventPayload) => HookResult;
    'events:dev': (
      payload: EventPayload & {
        _devStatus: 'success' | 'error';
      },
    ) => HookResult;
  }
}

export {};