import { truncate } from './signal'

/**
 * Identity events — the content-free behaviour stream.
 *
 * Emitted for every visitor through the normal `events:track` pipeline, so each
 * row already carries `page`, `ts`, `visitor` and `review`. What is added here is
 * only WHICH authored thing was touched, never WHAT the visitor typed:
 *
 *   ui.click    data: { target, label?, section? }
 *   ui.section  data: { section, visible }
 *   ui.page     data: { from? }
 *
 * Hard rule: no pixel coordinates, no input values, no keystrokes. `target` is
 * built from authored attributes only and `label` never comes from a form field.
 *
 * === Section identity convention ===
 * A section is any element matching `[data-section]` or `section[id]`; its stable
 * identifier is `data-section` when present, otherwise the element's `id`.
 * `SectionWrapper` stamps `data-section` from its `sectionId` prop, so layer-built
 * pages are covered for free; a hand-rolled section on a consuming site opts in
 * with `data-section="pricing"` or plain `<section id="pricing">`. Put
 * `data-signal-ignore` on an element (or any ancestor) to keep it out entirely.
 */

/** Accessible-name budget. Pinned by the cross-repo contract. */
export const MAX_LABEL = 80

/** Elements that count as a section — see the convention above. */
export const SECTION_SELECTOR = '[data-section], section[id]'

/** A click resolves up to its nearest actionable ancestor; anything else is ignored. */
const CLICK_SELECTOR = [
  '[data-signal-target]',
  'a[href]',
  'button',
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  'summary',
  'input[type="submit"]',
  'input[type="button"]',
].join(', ')

const IGNORE_SELECTOR = '[data-signal-ignore]'

/** Never read text out of a field — that would be visitor-entered content. */
const FIELD_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'OPTION'])

const asElement = (value: unknown): Element | null => {
  const el = value as Element | null
  return el && typeof el.closest === 'function' ? el : null
}

/** Stable section id for an element or its nearest section ancestor. */
export const sectionIdOf = (node: unknown): string | undefined => {
  const section = asElement(node)?.closest(SECTION_SELECTOR)
  if (!section) return undefined
  return section.getAttribute('data-section') || section.id || undefined
}

/**
 * Component/tag identity — authored attributes only: an explicit
 * `data-signal-target`, else `tag#id`, else `tag[data-testid]`, else the tag.
 */
export const targetIdOf = (el: Element): string => {
  const explicit = el.getAttribute('data-signal-target')?.trim()
  if (explicit) return explicit.slice(0, 64)

  const tag = el.tagName.toLowerCase()
  if (el.id) return `${tag}#${el.id}`

  const testId = el.getAttribute('data-testid')?.trim()
  if (testId) return `${tag}[${testId}]`

  return tag
}

/** Accessible name, truncated. Fields contribute their `aria-label` and nothing else. */
export const labelOf = (el: Element): string | undefined => {
  const aria = el.getAttribute('aria-label')?.trim()
  if (aria) return truncate(aria, MAX_LABEL)
  if (FIELD_TAGS.has(el.tagName)) return undefined

  const text = el.textContent?.replace(/\s+/g, ' ').trim()
  return text ? truncate(text, MAX_LABEL) : undefined
}

export interface IdentityClick {
  target: string
  label?: string
  section?: string
}

/** Resolve a raw event target to the click identity, or `undefined` if not worth a row. */
export const resolveClick = (node: unknown): IdentityClick | undefined => {
  const start = asElement(node)
  if (!start || start.closest(IGNORE_SELECTOR)) return undefined

  const el = start.closest(CLICK_SELECTOR)
  if (!el) return undefined

  return {
    target: targetIdOf(el),
    label: labelOf(el),
    section: sectionIdOf(el),
  }
}

/** A click that lands twice on the same target this fast is one interaction. */
export const CLICK_DEDUPE_MS = 400

/** Wrap `emit` in the duplicate-click guard; returns a DOM click handler. */
export const createClickEmitter = (
  emit: (click: IdentityClick) => void,
  dedupeMs = CLICK_DEDUPE_MS,
) => {
  let lastKey = ''
  let lastAt = 0

  return (event: { target?: unknown } | null | undefined) => {
    const click = resolveClick(event?.target)
    if (!click) return

    const key = `${click.target}|${click.section ?? ''}`
    const now = Date.now()
    if (key === lastKey && now - lastAt < dedupeMs) return

    lastKey = key
    lastAt = now
    emit(click)
  }
}

export interface OutboundClick {
  /** Target hostname only — never the full URL, path or query. */
  host: string
  kind: 'outbound' | 'download'
  /** Lower-cased file extension, without the dot. Only set for `kind: 'download'`. */
  ext?: string
}

/**
 * File extensions that mark a link as a download regardless of host — the
 * click leaves the page (or opens a save dialog) the same way a navigation
 * to another site does, so it gets the same treatment as an outbound link.
 */
const DOWNLOAD_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx',
  'zip', 'rar', '7z', 'tar', 'gz',
  'dmg', 'exe', 'msi', 'pkg',
])

const EXTENSION_PATTERN = /\.([a-z0-9]+)$/i

/**
 * Resolve a raw click target to an outbound-link/download identity, or
 * `undefined` for an ordinary same-site link. `currentHost` is injectable for
 * tests; production callers rely on the `window.location.hostname` default.
 *
 * Only `http(s)` links are considered — `mailto:`/`tel:`/`javascript:` etc.
 * have no meaningful "host" in this sense and are left alone. A link is a
 * `download` when it names a known document/archive/installer extension
 * (checked first, since a `.pdf` hosted on the same site is still a file
 * leaving the page) or carries the `download` attribute; otherwise it's
 * `outbound` when its hostname differs from the current one.
 */
export const resolveOutbound = (
  node: unknown,
  currentHost: string = window.location.hostname,
): OutboundClick | undefined => {
  const start = asElement(node)
  if (!start || start.closest(IGNORE_SELECTOR)) return undefined

  const anchor = start.closest('a[href]')
  if (!anchor) return undefined

  let url: URL
  try {
    url = new URL(anchor.getAttribute('href') || '', window.location.href)
  }
  catch {
    return undefined
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined

  const ext = EXTENSION_PATTERN.exec(url.pathname)?.[1]?.toLowerCase()
  const isDownload = anchor.hasAttribute('download') || (!!ext && DOWNLOAD_EXTENSIONS.has(ext))

  if (isDownload) return { host: url.hostname, kind: 'download', ...(ext ? { ext } : {}) }
  if (url.hostname.toLowerCase() !== currentHost.toLowerCase()) {
    return { host: url.hostname, kind: 'outbound' }
  }

  return undefined
}

/** Wrap `emit` for a raw DOM click event; returns a DOM click handler. */
export const createOutboundEmitter = (emit: (outbound: OutboundClick) => void) =>
  (event: { target?: unknown } | null | undefined) => {
    const outbound = resolveOutbound(event?.target)
    if (outbound) emit(outbound)
  }

/** How long a section must hold a visibility state before it is worth a row. */
export const SECTION_SETTLE_MS = 400

export interface SectionEntry {
  target: unknown
  isIntersecting: boolean
}

/**
 * Visibility TRANSITIONS only, and only settled ones.
 *
 * A section reports `visible: true` once it has stayed in view for `settleMs`,
 * and `visible: false` once it has stayed out for the same. Scrolling straight
 * past ten sections therefore emits nothing rather than twenty rows, and a
 * section that is simply on screen never re-emits.
 */
export const createSectionTracker = (
  emit: (section: string, visible: boolean) => void,
  settleMs = SECTION_SETTLE_MS,
) => {
  const emitted = new Map<string, boolean>()
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  const settle = (section: string, visible: boolean) => {
    const pending = timers.get(section)
    if (pending) {
      clearTimeout(pending)
      timers.delete(section)
    }

    // Already reported in this state — nothing has transitioned.
    if (emitted.get(section) === visible) return
    // First sighting of an off-screen section is not a transition either.
    if (!emitted.has(section) && !visible) return

    timers.set(section, setTimeout(() => {
      timers.delete(section)
      emitted.set(section, visible)
      emit(section, visible)
    }, settleMs))
  }

  return {
    observe: (entries: SectionEntry[]) => {
      for (const entry of entries) {
        const section = sectionIdOf(entry.target)
        if (section) settle(section, entry.isIntersecting)
      }
    },
    stop: () => {
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
    },
  }
}
