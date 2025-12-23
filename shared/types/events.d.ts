import type { HookResult } from '@nuxt/schema';

declare global {
  type TrackedEvents =
    | 'element_viewed'
    | 'form_submitted'
    | 'form_error'
    | 'cta_click'
    | 'section_view';

  type TrackedActions =
    | 'page_view'
    | 'click'
    | 'submit'
    | 'submission_failed'
    | 'devtools_trigger'
    | 'dev_trigger'
    | 'view';
}

export interface EventPayload {
  id: string;
  type: TrackedEvents;
  action: TrackedActions;
  location: string;
  target?: string;
  timestamp?: number;
  data?: {
    formData?: Record<string, any>;
    userId?: string;
    offerId?: string;
    antiSpam?: {
      honeypot?: string;
      timeOnForm?: number;
      jsToken?: string;
      turnstileToken?: string;
    };
    metadata?: Record<string, any>;
    // Generic data record for other event types
    [key: string]: any;
  };
  response?: Record<string, any>;
  _devToolsTriggered?: boolean;
  error?: any;
}

declare module '#app' {
  interface RuntimeNuxtHooks {
    'events:emit': (payload: EventPayload) => HookResult;
    'events:dev': (event: {
      eventId: string;
      eventType: TrackedEvents;
      status: 'success' | 'error';
      data?: Record<string, any>;
      error?: any;
    }) => HookResult;
  }
}

export {};
