import { useDebounceFn, useEventListener } from '@vueuse/core'
import { useEvents } from '../composables/useEvents'
import {
  SECTION_SELECTOR,
  createClickEmitter,
  createOutboundEmitter,
  createSectionTracker,
} from '../utils/identity'

/** Matches SectionWrapper's own intersection threshold. */
const SECTION_THRESHOLD = 0.25
/** Sections rendered after navigation settle within this window. */
const RESCAN_DEBOUNCE_MS = 300

/**
 * Always-on identity events for every visitor: `ui.click`, `ui.section`,
 * `ui.page`. Content-free by construction — see `runtime/utils/identity.ts` for
 * the rules and the section-id convention.
 *
 * No bot filtering here on purpose: `visitor.class` is stamped server-side from
 * the request User-Agent at ingest (`server/utils/visitor-class.ts`) and consumers
 * filter on it. Duplicating that client-side would only add a second, weaker
 * verdict the server would overwrite anyway.
 */
export default defineNuxtPlugin({
  name: 'events-identity',
  dependsOn: ['events-core'],
  setup(nuxtApp) {
    if (!import.meta.client) return

    const { trackEvent } = useEvents()

    /**
     * Identity events are ambient — they must never surface as a page error.
     * Anything downstream (storage blocked in private mode, a failed POST) is
     * swallowed: a dropped row costs a data point, a thrown one costs the visit.
     */
    const emit = (event: Parameters<typeof trackEvent>[0]) => {
      try {
        void Promise.resolve(trackEvent(event)).catch(() => {})
      }
      catch { /* ignored by design */ }
    }

    // === ui.click ===
    const onClick = createClickEmitter((click) => {
      emit({
        type: 'ui.click',
        target: click.target,
        data: { label: click.label, section: click.section },
      })
    })

    useEventListener(document, 'click', onClick, { capture: true, passive: true })

    // === ui.outbound ===
    // Fires through the same `emit()` → trackEvent → hook → queue pipe as
    // every other identity event: fire-and-forget, so it never blocks or
    // delays the navigation/download the click is triggering. The queue's own
    // `sendBeacon` flush on `pagehide` (`useSignalQueue.ts`) is what gets a
    // same-tab outbound navigation's row out before the page unloads; a
    // `target="_blank"` link or a download that never navigates just rides
    // the normal debounced flush since the page stays open.
    const onOutboundClick = createOutboundEmitter((outbound) => {
      emit({ type: 'ui.outbound', data: { ...outbound } })
    })

    useEventListener(document, 'click', onOutboundClick, { capture: true, passive: true })

    // === ui.section ===
    if (typeof IntersectionObserver !== 'undefined') {
      const tracker = createSectionTracker((section, visible) => {
        emit({ type: 'ui.section', data: { section, visible } })
      })

      const observer = new IntersectionObserver(
        entries => tracker.observe(entries),
        { threshold: SECTION_THRESHOLD },
      )

      const seen = new WeakSet<Element>()
      const scan = () => {
        for (const el of document.querySelectorAll(SECTION_SELECTOR)) {
          if (seen.has(el)) continue
          seen.add(el)
          observer.observe(el)
        }
      }

      const scanSoon = useDebounceFn(scan, RESCAN_DEBOUNCE_MS)
      nuxtApp.hook('app:mounted', () => {
        scan()
        // Sections can arrive after the route settles (async content, transitions).
        new MutationObserver(() => void scanSoon()).observe(document.body, {
          childList: true,
          subtree: true,
        })
      })
      nuxtApp.hook('page:finish', scan)

      useEventListener(window, 'pagehide', () => {
        tracker.stop()
        observer.disconnect()
      })
    }

    // === ui.page ===
    // Nothing else in the pipeline marks a navigation, so route changes get their
    // own row. Also fires on first load, so a `?polaris_review=` visit produces a
    // tagged row even if the visitor never clicks anything.
    let previous: string | undefined
    const page = () => {
      const path = window.location.pathname
      if (path === previous) return
      const from = previous
      previous = path
      emit({ type: 'ui.page', data: { from } })
    }

    nuxtApp.hook('app:mounted', page)
    nuxtApp.hook('page:finish', page)
  },
})
