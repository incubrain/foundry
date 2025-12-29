import type { EventPayload } from '../types/events';

export default defineNuxtPlugin({
  name: 'events-provider-umami',
  dependsOn: ['events-core'],
  setup(nuxtApp) {
    nuxtApp.hook('events:track', async (payload: EventPayload) => {
      const { $scripts } = nuxtApp;

      if ($scripts?.umamiAnalytics?.proxy) {
        try {
          await $scripts.umamiAnalytics.proxy.track(payload.type, {
            event_id: payload.id,
            location: payload.location,
            action: payload.action,
            target: payload.target,
            timestamp: payload.timestamp,
            ...payload.data,
          });
        } catch (error) {
          console.error('[Umami Provider] Track failed:', error);
        }
      }
    });
  },
});
