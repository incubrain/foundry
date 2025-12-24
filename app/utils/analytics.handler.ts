// shared/handlers/analytics.ts
import type { EventPayload } from '#shared/types/events';

export const analyticsHandler = (payload: EventPayload) => {
  // Only run in production/client
  if (import.meta.server) return;

  try {
    const { $scripts } = useNuxtApp();
    const umamiScript = $scripts.umamiAnalytics;

    if (umamiScript.proxy?.track) {
      sendToAnalytics(payload, umamiScript.proxy);
    }
  } catch (error) {
    console.error('Analytics handler failed:', error);
  }
};

function sendToAnalytics(payload: EventPayload, analyticsProxy: any) {
  const eventName = `${payload.type}`;

  // Extract user identity and traffic attribution
  const userId = payload.userId;

  const eventData = {
    event_id: payload.id,
    target: payload.target,
    timestamp: payload.timestamp,
    id: userId,
  };

  switch (payload.type) {
    case 'form_submitted':
      analyticsProxy.track('form_submitted', eventData);
      break;

    case 'form_error':
      analyticsProxy.track('form_error', eventData);
      break;

    default:
      analyticsProxy.track(eventName, eventData);
  }
}
