import type { EventPayload } from '../types/events';

export const useEvents = () => {
  const nuxtApp = useNuxtApp();

  const trackEvent = async (event: Partial<EventPayload>) => {
    // Assumes useUserIdentity is available in the runtime context
    const { getUserId } = useUserIdentity();

    const payload: EventPayload = {
      id: event.id || crypto.randomUUID(),
      type: event.type!,
      action: event.action!,
      location: event.location!,
      target: event.target,
      timestamp: Date.now(),
      data: {
        ...event.data,
        userId: getUserId(),
      },
    };

    // Emit hook for all providers
    await nuxtApp.callHook('events:track', payload);

    return payload.response;
  };

  return { trackEvent };
};
