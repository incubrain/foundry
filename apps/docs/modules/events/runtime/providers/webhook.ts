import type { EventPayload } from '../types/events';

export default defineNuxtPlugin({
  name: 'events-webhook',
  setup() {
    const nuxtApp = useNuxtApp();

    nuxtApp.hook('events:track', async (payload: EventPayload) => {
      // Only handle form submissions
      if (payload.type !== 'form_submitted') return;

      try {
        const response = await $fetch('/api/v1/webhook', {
          method: 'POST',
          body: {
            formData: payload.data?.formData,
            antiSpam: payload.data?.antiSpam,
          },
        });

        payload.response = response;
      } catch (error) {
        console.error('[Webhook Provider] Failed:', error);
        payload.error = error;
        throw error;
      }
    });
  },
});
