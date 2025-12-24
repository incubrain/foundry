// composables/useEvents.ts
import type { EventInput, EventPayload } from '#shared/types/events';

export const useEvents = () => {
  const nuxtApp = useNuxtApp();
  const { getUserId } = useUserIdentity();

  const trackEvent = async (event: EventInput): Promise<Record<string, any> | undefined> => {
    const userId = getUserId();
    const timestamp = Date.now();

    // ✅ Type-safe construction of complete payload
    const payload: EventPayload = {
      ...event,
      userId,
      timestamp,
    } as EventPayload;

    await nuxtApp.callHook('events:emit', payload);

    return payload.response;
  };

  return { trackEvent };
};