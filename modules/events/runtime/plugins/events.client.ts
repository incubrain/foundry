import type { EventPayload } from '../types/events';

export default defineNuxtPlugin({
  name: 'events-core',
  enforce: 'pre',
  setup() {
    // Core plugin sets up hook infrastructure
    // Providers register and listen to events:track hook

    return {
      provide: {
        events: {
          track: async (payload: EventPayload) => {
            await useNuxtApp().callHook('events:track', payload);
          },
        },
      },
    };
  },
});
