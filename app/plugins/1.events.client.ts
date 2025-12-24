// plugins/events.client.ts
import type { EventPayload, TrackedEvents } from '#shared/types/events';

type EventHandler = (payload: EventPayload) => void | Promise<any>;

// Global handlers that run for ALL events
const globalHandlers: EventHandler[] = [analyticsHandler];

// ✅ Pre-computed handler map (built once at plugin setup)
const EVENT_HANDLER_CONFIG: Record<TrackedEvents, EventHandler[]> = {
  form_submitted: [webhookHandler],
  form_error: [],
  offer_click: [],
  section_view: [],
};

// Handler map (built once in setup)
let eventHandlers: Map<TrackedEvents, EventHandler[]>;

export default defineNuxtPlugin({
  name: 'events',
  enforce: 'pre',
  setup() {
    const config = useRuntimeConfig();

    // Add console logger conditionally
    if (config.public.debug) {
      globalHandlers.push(consoleLogger);
    }

    // ✅ Build handler map once (O(1) lookup later)
    eventHandlers = new Map<TrackedEvents, EventHandler[]>();
    for (const [eventType, specificHandlers] of Object.entries(
      EVENT_HANDLER_CONFIG,
    )) {
      eventHandlers.set(eventType as TrackedEvents, [
        ...globalHandlers,
        ...specificHandlers,
      ]);
    }

    return {};
  },
  hooks: {
    'events:emit': async (payload: EventPayload) => {
      // ✅ O(1) map lookup - no type guards needed at runtime
      const handlers = eventHandlers.get(payload.type);
      const nuxtApp = useNuxtApp();

      if (!handlers) {
        if (import.meta.dev) {
          console.warn(`No handlers for event: ${payload.type}`);
        }
        return;
      }

      // Execute handlers
      for (const handler of handlers) {
        try {
          const result = await handler(payload);

          if (result !== undefined) {
            payload.response = result;
          }
        } catch (error) {
          console.error(`Handler failed for ${payload.type}:`, error);
          payload.error = error;

          if (payload._devToolsTriggered && import.meta.dev) {
            nuxtApp.callHook('events:dev', {
              ...payload,
              _devStatus: 'error' as const,
            });
          }
        }
      }

      if (payload._devToolsTriggered && import.meta.dev) {
        nuxtApp.callHook('events:dev', {
          ...payload,
          _devStatus: 'success' as const,
        });
      }
    },
  },
  env: {
    islands: false,
  },
});