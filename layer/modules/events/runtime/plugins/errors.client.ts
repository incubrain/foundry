import { useEventListener } from '@vueuse/core'
import { useSignalQueue } from '../composables/useSignalQueue'
import { pageContext, truncate } from '../utils/signal'

const MAX_MESSAGE = 500
const MAX_STACK = 1000
/** An identical (name, message) pair is reported at most once per window. */
const DEDUPE_MS = 10_000
const MAX_SEEN = 50

/** Client errors → signal buffer as `kind: 'log', severity: 'error'`. */
export default defineNuxtPlugin({
  name: 'events-error-capture',
  dependsOn: ['events-core'],
  setup(nuxtApp) {
    const { enqueue } = useSignalQueue()

    const seen = new Map<string, number>()

    // An error loop (a render throwing every frame) must not flood the queue.
    const isDuplicate = (name: string, message: string | undefined) => {
      const now = Date.now()
      const key = `${name}\u0000${message}`
      const last = seen.get(key)
      if (last !== undefined && now - last < DEDUPE_MS) return true
      if (seen.size >= MAX_SEEN) {
        for (const [k, at] of seen) if (now - at >= DEDUPE_MS) seen.delete(k)
        if (seen.size >= MAX_SEEN) seen.clear()
      }
      seen.set(key, now)
      return false
    }

    const report = (name: string, message: unknown, stack?: string) => {
      if (isDuplicate(name, truncate(message, MAX_MESSAGE))) return
      enqueue({
        kind: 'log',
        severity: 'error',
        name,
        ...pageContext(),
        data: {
          message: truncate(message, MAX_MESSAGE),
          stack: truncate(stack, MAX_STACK),
        },
      })
    }

    const previous = nuxtApp.vueApp.config.errorHandler
    nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
      report('vue_error', (error as Error)?.message ?? error, (error as Error)?.stack)
      previous?.(error, instance, info)
    }

    // A stale tab asking for a chunk the last deploy deleted — the page is
    // about to reload, so this is the only trace the visitor hit a broken load.
    nuxtApp.hook('app:chunkError', (options) => {
      report('chunk_error', options?.error?.message ?? options?.error)
    })

    nuxtApp.hook('app:error', (error) => {
      report('app_error', error?.message ?? error, error?.stack)
    })

    useEventListener(window, 'error', (event: ErrorEvent) => {
      report('window_error', event.message, event.error?.stack)
    })

    useEventListener(window, 'unhandledrejection', (event: PromiseRejectionEvent) => {
      report('unhandled_rejection', event.reason?.message ?? event.reason, event.reason?.stack)
    })
  },
})
