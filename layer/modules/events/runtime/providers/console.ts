import type { EventPayload } from '../types/events';

export default defineNuxtPlugin({
  name: 'events-provider-console',
  dependsOn: ['events-core'],
  setup(nuxtApp) {
    nuxtApp.hook('events:track', (payload: EventPayload) => {
      console.info(`📊 Event [${payload.type}]:`, payload);
    });
  },
});
