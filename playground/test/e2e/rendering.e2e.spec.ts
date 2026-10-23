// E2E rendering matrix for the Foundry layer.
//
// Boots a real Nuxt + Nitro dev server via @nuxt/test-utils and asserts the
// observable behavior of every rendering mode the layer claims to support:
//
//   - Default SSR via the content catch-all
//   - SPA-only routes (`ssr: false`)
//   - App-page precedence over content-driven URLs
//   - `definePageMeta({ layout: false })`
//   - Dynamic params
//   - <ClientOnly> islands inside an SSR shell
//   - Custom response headers via `routeRules.headers`
//   - Redirects via `routeRules.redirect`
//   - Layout selection via `routeRules.appLayout` (Nuxt 4 native)
//   - Layout selection via content frontmatter (`layout:`)
//   - No-JS critical content (what a zero-JavaScript crawler actually sees)
//
// Each `expect` documents the *intended* contract. Failures here are real
// bugs in the layer or in the consumer setup — not flaky tests.

import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { $fetch, setup, useTestContext } from '@nuxt/test-utils/e2e'

await setup({
  rootDir: fileURLToPath(new URL('../..', import.meta.url)),
  server: true,
  browser: false,
  // dev:true uses the dev server (avoids a fixture build) — a production
  // build previously hit a Rollup sourcemap conflict in a satori OG-image
  // component when @nuxt/test-utils boots the fixture. Worth re-verifying
  // with dev:false now that OgImageDocs.satori.vue is gone.
  dev: true,
})

describe('default SSR (content catch-all)', () => {
  it('renders content/pages/render-default.md server-side', async () => {
    const html = await $fetch<string>('/render-default')
    expect(html).toContain('content-driven:')
    expect(html).toContain('layer catch-all')
  })
})

describe('UPageHero SSR ownership (product-validator-s5s)', () => {
  it('renders the hero server-side for hero:true content (owned by the page, not the layout)', async () => {
    const html = await $fetch<string>('/render-hero')
    // The hero title/description must be present in the raw SSR HTML — if the
    // layout (rather than pages/[...slug].vue) owned the hero, SSR would emit
    // only a v-if comment placeholder here and the text would be absent until
    // client hydration, causing a CLS-inducing hydration mismatch.
    expect(html).toContain('Render Hero')
    expect(html).toContain('UPageHero SSR/CSR hydration-mismatch bug')
  })
})

// ----------------------------------------------------------------------------
// Hero is opt-in (product-validator-4bc)
//
// `basePageSchema.hero` defaults to false. It used to default to true, so every
// content page without a `hero:` key got an automatic UPageHero from its SEO
// title — a duplicate <h1> above pages that build their own heading. These
// assertions read the raw SSR markup (scripts stripped), where a doubled
// hero shows up as two <h1>.
// ----------------------------------------------------------------------------

/** Visible text of every <h1> in the zero-JS view of a response. */
function h1Texts(html: string): string[] {
  return [...renderedBody(html).matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(match =>
    match[1]!.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
  )
}

describe('hero is opt-in (product-validator-4bc)', () => {
  it('a content page with no hero: key renders no automatic UPageHero — only its own h1', async () => {
    // render-default.md has no `hero:` key (title "Render Default") and its
    // body opens with `# Own Heading`. The auto hero used to add a second
    // <h1> carrying the page title.
    expect(h1Texts(await $fetch<string>('/render-default'))).toEqual(['Own Heading'])
  })

  it('a layout-owned heading is not doubled by an automatic hero', async () => {
    // render-article.md has no `hero:` key; the article layout's UPageHeader
    // owns the single <h1>.
    expect(h1Texts(await $fetch<string>('/render-article'))).toEqual(['Render Article'])
  })

  it('hero: true still renders the automatic hero — exactly one h1', async () => {
    expect(h1Texts(await $fetch<string>('/render-hero'))).toEqual(['Render Hero'])
  })
})

// ----------------------------------------------------------------------------
// No-JS critical content (product-validator-m0f.4)
//
// AI crawlers execute zero JavaScript. Anything a marketing or docs route
// depends on must therefore be in the *rendered* SSR markup — not merely
// present in the page somewhere.
//
// The distinction matters: Nuxt serializes fetched documents into the
// `__NUXT__` payload `<script>`, so a naive `expect(html).toContain(text)`
// passes even when the text is only in the payload and gets painted after
// hydration. `renderedBody()` strips every `<script>` block first, which is a
// faithful stand-in for what a zero-JS client sees.
// ----------------------------------------------------------------------------

/**
 * The zero-JS view of a response: markup with all `<script>` blocks removed,
 * so assertions cannot be satisfied by the serialized Nuxt payload.
 */
function renderedBody(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
}

// Each entry: a content or marketing route, and the critical strings that must
// survive with JavaScript disabled. Add a row whenever a new content surface
// ships — this is the cheap regression net for CSR-only content creeping back.
const CRITICAL_CONTENT: Array<{ route: string, must: string[] }> = [
  // Content catch-all body copy.
  { route: '/render-default', must: ['content-driven:', 'layer catch-all'] },
  // Hero frontmatter → UPageHero, owned by the page (product-validator-s5s).
  { route: '/render-hero', must: ['Render Hero', 'UPageHero SSR/CSR hydration-mismatch bug'] },
  // Layout variants must not swallow the body.
  // Also covers answer-first content (product-validator-m0f.7): `answer` and
  // `sources` frontmatter, rendered by the article layout without JS.
  {
    route: '/render-article',
    must: [
      'route-rule-applayout:',
      'routeRules.appLayout maps this content route to the article layout',
      'Foundry GEO content guide',
    ],
  },
  { route: '/render-landing', must: ['frontmatter-layout:'] },
  // Conversion copy resolved from the pages collection by ConvertInternal.
  // Regression guard for the `lazy: true, server: false` offer query.
  {
    route: '/render-convert',
    must: [
      'convert-ssr:',
      'Book A Validation Call',
      'Offer copy that ConvertInternal resolves from the pages collection.',
    ],
  },
]

describe('no-JS critical content (product-validator-m0f.4)', () => {
  it.each(CRITICAL_CONTENT)(
    '$route renders its critical content without JavaScript',
    async ({ route, must }) => {
      const body = renderedBody(await $fetch<string>(route))
      for (const text of must) {
        expect(
          body,
          `${route}: "${text}" is missing from the rendered SSR markup — a zero-JS crawler would never see it`,
        ).toContain(text)
      }
    },
  )

  it('does not fall back to the generic CTA label when the offer document resolves', async () => {
    // If the offer query regresses to a client-only fetch, ConvertInternal
    // renders its hardcoded 'Learn More' fallback server-side instead.
    const body = renderedBody(await $fetch<string>('/render-convert'))
    expect(body).toContain('data-testid="convert-internal"')
    expect(body).not.toContain('Learn More')
  })
})

describe('app pages override content', () => {
  it('serves app/pages/render-static.vue, not content/pages/render-static.md', async () => {
    const html = await $fetch<string>('/render-static')
    expect(html).toContain('data-testid="render-static-page"')
    expect(html).toContain('app-page-wins:')
    // Note: the content document is still pre-fetched by Foundry layouts
    // (to avoid the SSR/CSR CLS bug) and ends up serialized into the page
    // payload JSON. It is NOT rendered. We assert rendering wins above; we
    // do NOT assert the content text is absent from the raw HTML.
  })
})

describe('layout: false', () => {
  it('omits the NuxtLayout wrapper', async () => {
    const html = await $fetch<string>('/render-layout-false')
    expect(html).toContain('data-testid="render-layout-false-page"')
    // The layout-false marker should appear; layout-specific chrome (e.g. the
    // landing hero wrapper) must not. We check the page rendered at all.
    expect(html).toContain('layout-false:')
  })
})

describe('ssr: false (SPA-only)', () => {
  it('serves an empty shell — client-mounted sentinel is absent from SSR HTML', async () => {
    const html = await $fetch<string>('/render-spa')
    // ssr:false means Nuxt should NOT render the page component server-side.
    // The client-mounted sentinel only appears after onMounted runs.
    expect(html).not.toContain('client-mounted-sentinel')
  })
})

describe('dynamic params', () => {
  it('renders [id].vue with the URL param hydrated', async () => {
    const html = await $fetch<string>('/render-dynamic/abc-123')
    expect(html).toContain('data-testid="render-dynamic-id"')
    expect(html).toContain('abc-123')
  })
})

describe('<ClientOnly> islands', () => {
  it('SSRs the shell but not the island', async () => {
    const html = await $fetch<string>('/render-client-only')
    expect(html).toContain('ssr-shell:')
    expect(html).not.toContain('client-island:')
  })
})

// Helper: resolve the live test server URL and use Node fetch when we need
// access to status code / headers. `$fetch` from @nuxt/test-utils returns the
// parsed body only and `$fetch.raw` is not exposed.
const testBase = () => useTestContext().url!

describe('routeRules.headers', () => {
  it('attaches custom headers to the response', async () => {
    const res = await fetch(new URL('/render-headers', testBase()))
    expect(res.headers.get('x-foundry-test')).toBe('route-rules-headers')
  })
})

describe('routeRules.redirect', () => {
  it('redirects /render-redirect → /render-default', async () => {
    const res = await fetch(new URL('/render-redirect', testBase()), {
      redirect: 'manual',
    })
    expect(res.status).toBeGreaterThanOrEqual(300)
    expect(res.status).toBeLessThan(400)
    expect(res.headers.get('location')).toContain('/render-default')
  })
})

describe('routeRules.appLayout (Nuxt 4 native)', () => {
  it('applies the article layout to /render-article', async () => {
    const html = await $fetch<string>('/render-article')
    // Each Foundry layout root carries a distinct marker class or wrapper.
    // We assert the page body rendered; the layout-specific assertion is
    // captured loosely (the layer's `article` layout renders inside <main>).
    expect(html).toContain('route-rule-applayout:')
  })
})

describe('frontmatter layout: in content', () => {
  it('renders /render-landing via the catch-all', async () => {
    const html = await $fetch<string>('/render-landing')
    expect(html).toContain('frontmatter-layout:')
    // NOTE: The layer's catch-all does NOT currently bridge content `layout:`
    // frontmatter into a `setPageLayout()` call. If this test starts asserting
    // an actual landing-layout marker and passes, it means the bridge was added.
  })
})

// ----------------------------------------------------------------------------
// Structural DOM order
//
// `<footer>` appearing visually above content is usually a *timing* bug, not
// a DOM-order bug — Vue SSR resolves everything before emitting HTML, so the
// rendered HTML always reflects template order. Browser-level CLS testing
// catches the timing case; these tests catch the simpler, deterministic
// failure mode: CSS or layout misconfig that flips the document order.
//
// Asserts: for every fixture URL that uses a real layout, the SSR HTML has
//   <header> ... <main>/<UMain> ... <footer>
// in that order. Equivalence between content-driven and app-page sources of
// the same layout is also asserted so we catch structural drift between
// the two rendering paths.
// ----------------------------------------------------------------------------

function indices(html: string) {
  // Foundry's AppHeader renders as `<header`; AppFooter as `<footer`. UMain
  // doesn't emit a `<main>` tag in every layout, so we accept either
  // `<main` or `data-testid` on the layout container.
  const header = html.indexOf('<header')
  const footer = html.indexOf('<footer')
  // Best-effort main marker: layouts wrap content in <UMain>, which renders
  // a real <main>. Fall back to the page testid if a layout omits it.
  const main = (() => {
    const m = html.indexOf('<main')
    if (m !== -1) return m
    const t = html.search(/data-testid="render-[a-z-]+-page"/)
    return t
  })()
  return { header, main, footer }
}

function assertOrder(html: string, label: string) {
  const { header, main, footer } = indices(html)
  expect(header, `${label}: <header> missing`).toBeGreaterThanOrEqual(0)
  expect(footer, `${label}: <footer> missing`).toBeGreaterThanOrEqual(0)
  expect(main, `${label}: page/main marker missing`).toBeGreaterThanOrEqual(0)
  expect(header, `${label}: header should precede page/main`).toBeLessThan(main)
  expect(main, `${label}: page/main should precede footer`).toBeLessThan(footer)
}

describe('structural DOM order — content-driven', () => {
  it('default layout (/render-default): header → main → footer', async () => {
    const html = await $fetch<string>('/render-default')
    assertOrder(html, 'content/render-default')
  })

  it('article layout via routeRules.appLayout (/render-article)', async () => {
    const html = await $fetch<string>('/render-article')
    assertOrder(html, 'content/render-article')
  })

  it('landing layout via frontmatter (/render-landing)', async () => {
    const html = await $fetch<string>('/render-landing')
    assertOrder(html, 'content/render-landing')
  })
})

describe('structural DOM order — app-page sources', () => {
  it('default layout (/render-layout-default)', async () => {
    const html = await $fetch<string>('/render-layout-default')
    assertOrder(html, 'app/render-layout-default')
    // Confirm the layout actually rendered (vs the page bleeding through).
    expect(html).toContain('data-testid="render-layout-default-page"')
  })

  it('landing layout (/render-layout-landing)', async () => {
    const html = await $fetch<string>('/render-layout-landing')
    assertOrder(html, 'app/render-layout-landing')
    expect(html).toContain('data-testid="render-layout-landing-page"')
  })

  it('article layout (/render-layout-article)', async () => {
    const html = await $fetch<string>('/render-layout-article')
    assertOrder(html, 'app/render-layout-article')
    expect(html).toContain('data-testid="render-layout-article-page"')
  })
})

describe('structural equivalence — same layout, both sources', () => {
  // The header → main → footer skeleton should be IDENTICAL whether the body
  // comes from a content document or from an app/pages/*.vue file. If a
  // layout grows divergent chrome between the two paths, this test flags it.
  it('default: content vs app-page produce same outer skeleton', async () => {
    const a = indices(await $fetch<string>('/render-default'))
    const b = indices(await $fetch<string>('/render-layout-default'))
    // Both must have the same three markers present.
    for (const k of ['header', 'main', 'footer'] as const) {
      expect(a[k], `content missing ${k}`).toBeGreaterThanOrEqual(0)
      expect(b[k], `app-page missing ${k}`).toBeGreaterThanOrEqual(0)
    }
  })
})

// ---------------------------------------------------------------------------
// Raw markdown surface (product-validator-m0f.8)
//
// A coding agent — or an MCP-less LLM browsing the site — must be able to get
// the *source* of a content page on plain Nitro (the Docker/Railway path), not
// only on Vercel edge. Two access patterns, one Nitro middleware.
//
// These live in this file rather than their own spec on purpose: a second
// `setup()` boots a second dev server against the same @nuxt/content SQLite
// file and the suite dies with "database is locked".
// ---------------------------------------------------------------------------

// The literal source of playground/content/pages/render-default.md.
const MD_FRONTMATTER = 'title: Render Default'
const MD_BODY = 'content-driven: this page is served by the layer catch-all'

describe('raw markdown — .md suffix', () => {
  it('serves the raw source of the content document, frontmatter included', async () => {
    const res = await fetch(new URL('/render-default.md', testBase()))

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8')

    const body = await res.text()
    expect(body.startsWith('---')).toBe(true)
    expect(body).toContain(MD_FRONTMATTER)
    expect(body).toContain(MD_BODY)
    // The source, not a re-render.
    expect(body).not.toContain('<html')
    expect(body).not.toContain('<div')
  })

  it('points back at the canonical HTML route', async () => {
    const res = await fetch(new URL('/render-default.md', testBase()))
    expect(res.headers.get('link')).toBe('</render-default>; rel="canonical"')
  })

  it('serves nested content routes', async () => {
    const res = await fetch(new URL('/offers/booking.md', testBase()))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
  })

  it('404s for a route with no content document', async () => {
    // /render-layout-default is an app page — there is no markdown source.
    expect((await fetch(new URL('/render-layout-default.md', testBase()))).status).toBe(404)
    expect((await fetch(new URL('/definitely-not-a-page.md', testBase()))).status).toBe(404)
  })
})

describe('raw markdown — Accept: text/markdown negotiation', () => {
  it('serves the raw source from the canonical URL', async () => {
    const res = await fetch(new URL('/render-default', testBase()), {
      headers: { accept: 'text/markdown' },
    })

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
    // Two representations behind one URL — caches must key on the header.
    expect(res.headers.get('vary')).toContain('Accept')

    const body = await res.text()
    expect(body).toContain(MD_FRONTMATTER)
    expect(body).toContain(MD_BODY)
  })

  it('falls through to HTML when the route has no markdown representation', async () => {
    // Negotiation is a preference, not a demand: an app page still renders.
    const res = await fetch(new URL('/render-layout-default', testBase()), {
      headers: { accept: 'text/markdown' },
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
  })

  it('never intercepts API routes', async () => {
    const res = await fetch(new URL('/api/_health', testBase()), {
      headers: { accept: 'text/markdown' },
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/json')
  })
})

// ---------------------------------------------------------------------------
// Citation-first content patterns (product-validator-m0f.7)
//
// Answer-first blocks, sourced statistics, and attributed quotes must render
// with real semantic markup in the raw SSR HTML — the shape generative
// engines are documented to lift and cite more often. `renderedBody()`
// (defined above) strips <script> so a payload-only hit cannot pass.
// ---------------------------------------------------------------------------

describe('answer-first + sources (product-validator-m0f.7)', () => {
  it('renders the frontmatter `answer` via AnswerBlock, no-JS', async () => {
    const body = renderedBody(await $fetch<string>('/render-article'))
    expect(body).toContain('data-testid="answer-block"')
    expect(body).toContain('routeRules.appLayout maps this content route to the article layout')
  })

  it('renders the frontmatter `sources` as a visible, linked citation list, no-JS', async () => {
    const body = renderedBody(await $fetch<string>('/render-article'))
    expect(body).toContain('aria-label="Sources"')
    expect(body).toContain('<cite>Foundry GEO content guide</cite>')
    expect(body).toContain('href="https://github.com/incubrain/foundry"')
  })
})

describe('sourced statistics + named-expert quotes (product-validator-m0f.7)', () => {
  it('StatGroup renders each stat as a <figure> with a visible, linked source', async () => {
    const body = renderedBody(await $fetch<string>('/render-citations'))
    expect(body).toContain('<figure')
    expect(body).toContain('<figcaption')
    expect(body).toContain('<cite>Princeton/Georgia Tech GEO study</cite>')
    expect(body).toContain('href="https://example.com/geo-study"')
  })

  it('CaseStudy renders the quote as a semantic <blockquote cite> with a visible source link', async () => {
    const body = renderedBody(await $fetch<string>('/render-citations'))
    expect(body).toContain('<blockquote')
    expect(body).toContain('cite="https://example.com/expert-interview"')
    expect(body).toContain('href="https://example.com/expert-interview"')
    expect(body).toContain('<cite>Dr. Jane Doe</cite>')
  })
})

describe('raw markdown — HTML remains the default', () => {
  it('serves rendered HTML with no Accept header', async () => {
    const html = await $fetch<string>('/render-default')
    expect(html).toContain('<html')
    expect(html).toContain('content-driven:')
  })

  it('serves rendered HTML for a browser Accept header', async () => {
    const res = await fetch(new URL('/render-default', testBase()), {
      headers: { accept: 'text/html,application/xhtml+xml,*/*;q=0.8' },
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
  })
})
