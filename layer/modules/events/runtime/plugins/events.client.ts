import type { EventPayload } from '../types/events'

export default defineNuxtPlugin({
  name: 'events-core',
  enforce: 'pre',
  setup(nuxtApp) {
    // Core plugin sets up the hook infrastructure. The signal provider listens
    // to `events:track` and queues each payload for /api/_signals/ingest.

    // Visitor identity is a server-side daily hash now (product-validator-ev2.1);
    // nothing is stored on the device. Clear the stored ID older builds wrote.
    try {
      useAppStorage().local.remove('userId')
    }
    catch {
      // Storage can throw outright (private mode, blocked site data) — then
      // there is nothing stored to clear either.
    }

    // Dev visibility only — `events.debug` in nuxt.config.
    if (useRuntimeConfig().public.events?.debug) {
      nuxtApp.hook('events:track', (payload: EventPayload) => {
        console.info(`📊 Event [${payload.type}]:`, payload)
      })
    }

    return {
      provide: {
        events: {
          track: async (payload: EventPayload) => {
            await useNuxtApp().callHook('events:track', payload)
          },
        },
      },
    }
  },
})
