import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  MAX_LABEL,
  createClickEmitter,
  createOutboundEmitter,
  createSectionTracker,
  labelOf,
  resolveClick,
  resolveOutbound,
  sectionIdOf,
  targetIdOf,
} from '@incubrain/foundry/modules/events/runtime/utils/identity'

const render = (html: string) => {
  document.body.innerHTML = html
  return (selector: string) => {
    const el = document.querySelector(selector)
    if (!el) throw new Error(`no element for ${selector}`)
    return el
  }
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('section identity convention', () => {
  it('prefers data-section over the element id', () => {
    const find = render('<section id="raw" data-section="pricing"><b>x</b></section>')

    expect(sectionIdOf(find('b'))).toBe('pricing')
  })

  it('falls back to the id of a plain <section>', () => {
    const find = render('<section id="pricing"><b>x</b></section>')

    expect(sectionIdOf(find('b'))).toBe('pricing')
  })

  it('ignores a section-less element and a bare id on a div', () => {
    const find = render('<div id="pricing"><b>x</b></div>')

    expect(sectionIdOf(find('b'))).toBeUndefined()
  })

  it('resolves the nearest section when they nest', () => {
    const find = render(
      '<section id="outer"><section data-section="inner"><b>x</b></section></section>',
    )

    expect(sectionIdOf(find('b'))).toBe('inner')
  })
})

describe('click target identity', () => {
  it('uses an explicit data-signal-target first', () => {
    const find = render('<button id="x" data-signal-target="hero-cta">Go</button>')

    expect(targetIdOf(find('button'))).toBe('hero-cta')
  })

  it('falls back to tag#id, then tag[data-testid], then the tag', () => {
    const find = render(`
      <button id="submit">A</button>
      <button data-testid="cta">B</button>
      <button>C</button>
    `)

    expect(targetIdOf(find('#submit'))).toBe('button#submit')
    expect(targetIdOf(find('[data-testid=cta]'))).toBe('button[cta]')
    expect(targetIdOf(find('button:last-of-type'))).toBe('button')
  })

  it('resolves a click on inner markup up to the actionable ancestor', () => {
    const find = render(
      '<section data-section="hero"><a href="/x" id="cta"><span>Book</span></a></section>',
    )

    expect(resolveClick(find('span'))).toEqual({
      target: 'a#cta',
      label: 'Book',
      section: 'hero',
    })
  })

  it('ignores clicks with no actionable ancestor', () => {
    const find = render('<div><p>just text</p></div>')

    expect(resolveClick(find('p'))).toBeUndefined()
  })

  it('honours data-signal-ignore on an ancestor', () => {
    const find = render('<div data-signal-ignore><button>Go</button></div>')

    expect(resolveClick(find('button'))).toBeUndefined()
  })

  it('survives a null or non-element target', () => {
    expect(resolveClick(null)).toBeUndefined()
    expect(resolveClick(window)).toBeUndefined()
  })
})

describe('label extraction is content-free', () => {
  it('prefers aria-label and collapses whitespace in text', () => {
    const find = render(`
      <button aria-label="Book a call">Go</button>
      <button id="b2">  Book\n  a   call  </button>
    `)

    expect(labelOf(find('[aria-label]'))).toBe('Book a call')
    expect(labelOf(find('#b2'))).toBe('Book a call')
  })

  it(`truncates the label to ${MAX_LABEL} chars`, () => {
    const find = render(`<button>${'y'.repeat(200)}</button>`)

    expect(labelOf(find('button'))).toHaveLength(MAX_LABEL)
  })

  it('never reads a value out of a form field', () => {
    const find = render('<input type="submit" value="secret@example.com">')

    expect(labelOf(find('input'))).toBeUndefined()
    expect(resolveClick(find('input'))?.label).toBeUndefined()
  })

  it('lets a field contribute its authored aria-label only', () => {
    const find = render('<input type="submit" aria-label="Send" value="secret">')

    expect(labelOf(find('input'))).toBe('Send')
  })

  it('emits no coordinates or key data anywhere in the payload', () => {
    const find = render('<section data-section="hero"><button id="go">Go</button></section>')
    const click = resolveClick(find('button'))

    expect(Object.keys(click!).sort()).toEqual(['label', 'section', 'target'])
  })
})

describe('createClickEmitter', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('emits one row per resolved click', () => {
    const find = render('<section data-section="hero"><button id="go">Go</button></section>')
    const emit = vi.fn()
    const handle = createClickEmitter(emit)

    handle({ target: find('button') })

    expect(emit).toHaveBeenCalledWith({ target: 'button#go', label: 'Go', section: 'hero' })
  })

  it('drops a repeat click on the same target inside the dedupe window', () => {
    const find = render('<button id="go">Go</button>')
    const emit = vi.fn()
    const handle = createClickEmitter(emit, 400)

    handle({ target: find('button') })
    vi.advanceTimersByTime(100)
    handle({ target: find('button') })

    expect(emit).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(500)
    handle({ target: find('button') })

    expect(emit).toHaveBeenCalledTimes(2)
  })

  it('does not dedupe two different targets', () => {
    const find = render('<button id="a">A</button><button id="b">B</button>')
    const emit = vi.fn()
    const handle = createClickEmitter(emit)

    handle({ target: find('#a') })
    handle({ target: find('#b') })

    expect(emit).toHaveBeenCalledTimes(2)
  })

  it('emits nothing for an unresolvable click', () => {
    const find = render('<p>text</p>')
    const emit = vi.fn()

    createClickEmitter(emit)({ target: find('p') })

    expect(emit).not.toHaveBeenCalled()
  })
})

describe('createSectionTracker', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const sections = () => {
    const find = render(
      '<section data-section="hero"></section><section data-section="pricing"></section>',
    )
    return { hero: find('[data-section=hero]'), pricing: find('[data-section=pricing]') }
  }

  const entry = (target: Element, isIntersecting: boolean) => ({ target, isIntersecting })

  it('emits visible:true once a section has settled in view', () => {
    const { hero } = sections()
    const emit = vi.fn()
    const tracker = createSectionTracker(emit, 400)

    tracker.observe([entry(hero, true)])
    expect(emit).not.toHaveBeenCalled()

    vi.advanceTimersByTime(400)
    expect(emit).toHaveBeenCalledWith('hero', true)
  })

  it('emits nothing when a fast scroll flips state before it settles', () => {
    const { hero, pricing } = sections()
    const emit = vi.fn()
    const tracker = createSectionTracker(emit, 400)

    for (let i = 0; i < 10; i++) {
      tracker.observe([entry(hero, true), entry(pricing, true)])
      vi.advanceTimersByTime(50)
      tracker.observe([entry(hero, false), entry(pricing, false)])
      vi.advanceTimersByTime(50)
    }
    vi.advanceTimersByTime(1000)

    expect(emit).not.toHaveBeenCalled()
  })

  it('reports transitions only — never the same state twice', () => {
    const { hero } = sections()
    const emit = vi.fn()
    const tracker = createSectionTracker(emit, 400)

    tracker.observe([entry(hero, true)])
    vi.advanceTimersByTime(400)
    tracker.observe([entry(hero, true)])
    vi.advanceTimersByTime(400)

    expect(emit).toHaveBeenCalledTimes(1)

    tracker.observe([entry(hero, false)])
    vi.advanceTimersByTime(400)

    expect(emit).toHaveBeenNthCalledWith(2, 'hero', false)
  })

  it('does not report a section that was never visible as leaving', () => {
    const { hero } = sections()
    const emit = vi.fn()
    const tracker = createSectionTracker(emit, 400)

    tracker.observe([entry(hero, false)])
    vi.advanceTimersByTime(1000)

    expect(emit).not.toHaveBeenCalled()
  })

  it('skips elements that carry no section identity', () => {
    const find = render('<div id="not-a-section"></div>')
    const emit = vi.fn()
    const tracker = createSectionTracker(emit, 400)

    tracker.observe([entry(find('div'), true)])
    vi.advanceTimersByTime(1000)

    expect(emit).not.toHaveBeenCalled()
  })

  it('stop() cancels pending emissions', () => {
    const { hero } = sections()
    const emit = vi.fn()
    const tracker = createSectionTracker(emit, 400)

    tracker.observe([entry(hero, true)])
    tracker.stop()
    vi.advanceTimersByTime(1000)

    expect(emit).not.toHaveBeenCalled()
  })
})

describe('resolveOutbound: outbound links and downloads', () => {
  // The test document's own origin is the "same site" — resolveOutbound
  // resolves a relative/same-origin href against `window.location.href`, and
  // this environment's origin isn't ours to rewrite via history.replaceState
  // (that throws SecurityError for a different origin), so links are built
  // from it rather than a hardcoded domain.
  const site = window.location.origin
  const host = window.location.hostname

  it('ignores a same-site absolute link', () => {
    const find = render(`<a href="${site}/about">About</a>`)

    expect(resolveOutbound(find('a'))).toBeUndefined()
  })

  it('ignores a relative link (always same-site)', () => {
    const find = render('<a href="/pricing">Pricing</a>')

    expect(resolveOutbound(find('a'))).toBeUndefined()
  })

  it('flags a different host as outbound, host only', () => {
    const find = render('<a href="https://partner.example/deal?ref=123">Partner</a>')

    expect(resolveOutbound(find('a'))).toEqual({ host: 'partner.example', kind: 'outbound' })
  })

  it('is case-insensitive comparing hosts', () => {
    const find = render(`<a href="HTTP://${host.toUpperCase()}/about">About</a>`)

    expect(resolveOutbound(find('a'))).toBeUndefined()
  })

  it('flags a known document extension as a download even on the same site', () => {
    const find = render('<a href="/files/report.pdf">Report</a>')

    expect(resolveOutbound(find('a'))).toEqual({ host, kind: 'download', ext: 'pdf' })
  })

  it('flags an external download with both host and ext', () => {
    const find = render('<a href="https://cdn.example.org/report.zip">Zip</a>')

    expect(resolveOutbound(find('a'))).toEqual({ host: 'cdn.example.org', kind: 'download', ext: 'zip' })
  })

  it('recognises the download attribute even without a matching extension', () => {
    const find = render('<a href="/export" download>Export</a>')

    expect(resolveOutbound(find('a'))).toEqual({ host, kind: 'download' })
  })

  it('resolves a click on inner markup up to the anchor', () => {
    const find = render('<a href="https://partner.example"><span>Go</span></a>')

    expect(resolveOutbound(find('span'))).toEqual({ host: 'partner.example', kind: 'outbound' })
  })

  it('ignores a click with no anchor ancestor', () => {
    const find = render('<button>Go</button>')

    expect(resolveOutbound(find('button'))).toBeUndefined()
  })

  it('ignores mailto: and tel: links — no meaningful host', () => {
    const find = render(`
      <a id="mail" href="mailto:hi@example.com">Email</a>
      <a id="tel" href="tel:+1234567890">Call</a>
    `)

    expect(resolveOutbound(find('#mail'))).toBeUndefined()
    expect(resolveOutbound(find('#tel'))).toBeUndefined()
  })

  it('honours data-signal-ignore on an ancestor', () => {
    const find = render('<div data-signal-ignore><a href="https://partner.example">Go</a></div>')

    expect(resolveOutbound(find('a'))).toBeUndefined()
  })

  it('accepts an explicit currentHost for testability', () => {
    const find = render(`<a href="${site}/about">About</a>`)

    expect(resolveOutbound(find('a'), 'other.example')).toEqual({ host, kind: 'outbound' })
  })

  it('never includes the path or query in the payload', () => {
    const find = render('<a href="https://partner.example/deal/secret?token=abc">Go</a>')
    const outbound = resolveOutbound(find('a'))

    expect(Object.keys(outbound!).sort()).toEqual(['host', 'kind'])
    expect(JSON.stringify(outbound)).not.toContain('secret')
    expect(JSON.stringify(outbound)).not.toContain('token')
  })
})

describe('createOutboundEmitter', () => {
  it('emits for an outbound click', () => {
    const find = render('<a href="https://partner.example">Go</a>')
    const emit = vi.fn()

    createOutboundEmitter(emit)({ target: find('a') })

    expect(emit).toHaveBeenCalledWith({ host: 'partner.example', kind: 'outbound' })
  })

  it('emits nothing for a same-site link', () => {
    const find = render('<a href="/about">About</a>')
    const emit = vi.fn()

    createOutboundEmitter(emit)({ target: find('a') })

    expect(emit).not.toHaveBeenCalled()
  })

  it('survives a null target', () => {
    const emit = vi.fn()

    expect(() => createOutboundEmitter(emit)(null)).not.toThrow()
    expect(emit).not.toHaveBeenCalled()
  })
})
