import type { HookResult } from '@nuxt/schema';
import type { SectionId } from '#shared/config/navigation';

// Offer IDs from content
export type OfferId = 'payment' | 'booking' | 'service' | 'social' | 'rss';
export type OfferExternal = `${OfferId}_external`;
export type OfferInternal = `${OfferId}_internal`;
export type OfferTarget = OfferExternal | OfferInternal;

export type TrackedEvents =
  | 'form_submitted'
  | 'form_error'
  | 'offer_click'
  | 'section_view';

export type EventTarget = SectionId | OfferTarget;

/**
 * Base fields that exist on ALL events
 */
export interface BaseEventPayload {
  id: string;
  userId?: string;
  timestamp: number;
  action?: string; // Optional in new system?
  location?: string;
  target?: string;
}

/**
 * Fields added during event processing
 */
export interface ProcessedEventFields {
  response?: any;
  error?: any;
  _devToolsTriggered?: boolean;
}

export interface FormSubmittedPayload
  extends BaseEventPayload, ProcessedEventFields {
  type: 'form_submitted';
  target: string;
  data: {
    formData: Record<string, any>;
    antiSpam?: any;
  };
}

export interface FormErrorPayload
  extends BaseEventPayload, ProcessedEventFields {
  type: 'form_error';
  target: string;
  error: any;
  data?: Record<string, any>;
}

export interface GenericEventPayload
  extends BaseEventPayload, ProcessedEventFields {
  type: TrackedEvents;
  data?: Record<string, any>;
}

export type EventPayload =
  | GenericEventPayload
  | FormSubmittedPayload
  | FormErrorPayload;

export interface AnalyticsProvider {
  name: string;
  track: (payload: EventPayload) => void | Promise<void>;
}

export interface ModuleOptions {
  providers: ('umami' | 'console' | 'webhook')[];
  webhook: {
    enabled: boolean;
    platforms: ('discord' | 'slack' | 'telegram')[];
  };
  debug: boolean;
}

export interface EventsHooks {
  'events:track': (payload: EventPayload) => void | Promise<void>;
  'events:provider:register': (provider: AnalyticsProvider) => void;
  'events:dev': (
    payload: EventPayload & {
      _devStatus: 'success' | 'error';
    },
  ) => void;
}

declare module '#app' {
  interface RuntimeNuxtHooks extends EventsHooks {}
}
