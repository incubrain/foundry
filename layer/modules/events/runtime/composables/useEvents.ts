import type { EventPayload, TrackEventInput } from '../types/events'

export const useEvents = () => {
  const nuxtApp = useNuxtApp()

  const trackEvent = async (event: TrackEventInput) => {
    const payload: EventPayload = {
      id: event.id || crypto.randomUUID(),
      type: event.type,
      action: event.action,
      location: event.location,
      target: event.target,
      timestamp: Date.now(),
      data: { ...event.data },
      error: event.error,
    }

    // Emit hook for all providers
    await nuxtApp.callHook('events:track', payload)

    return payload.response
  }

  return { trackEvent }
}
