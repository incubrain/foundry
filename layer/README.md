# @incubrain/foundry

A Nuxt 4 layer for marketing and validation sites that stream the full signal of whether
they are working — visitor events and site errors alike — to an external consumer over an
authenticated cursor endpoint.

Extending this layer gives you a content-driven site, the signal pipeline that feeds it,
and an agent-readable surface. It does not give you a design system: the layer ships
structure and signal, and your app supplies the taste.

## Installation

```bash
npm install @incubrain/foundry
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: ['@incubrain/foundry'],
})
```

**Requirements:** Nuxt 4.x, Node 22+.

`nuxt-llms` ships as a real dependency — every site gets `/llms.txt` and
`/llms-full.txt` with zero config, sections auto-populated from your content
collections; set `llms: {...}` in your own `nuxt.config.ts` to override.

Optional peer dependencies, added in your own app when you want them: `nuxt-studio`
(visual content editing), `@iconify-json/lucide` and `@iconify-json/simple-icons` (icon
sets), `better-sqlite3`.

## What you get

**Signal capture.** Client events (`useEvents()`) and client errors are batched to
`POST /api/_signals/ingest`; form captures and Nitro request errors are appended
server-side. All of it becomes one `SignalRow` envelope in a capped ring buffer, pulled by
a consumer at `GET /api/_signals/export?since=<seq>&limit=<n≤2000>` behind a bearer token.
Every row carries a server-derived `visitor.class` of `human`, `agent`, or `bot`, and a
cookieless `visitor.hash` (daily-salted hash of site + IP + User-Agent; nothing stored on
the device, raw IP never stored, salt deleted at UTC midnight). Nothing is pushed out — no webhook forwarders, no analytics vendors, no second destination.

**Identity events.** Always on, for every visitor: `ui.click`, `ui.section`, and `ui.page`
rows describing *which* authored thing was touched — never *what* was typed. No pixel
coordinates, no input values, no keystrokes. Sections are identified by `data-section` (or a
plain `<section id>`); `SectionWrapper` stamps it automatically. A `?polaris_review=<token>`
query param rides along as the row's own `review` field for one page load only, letting an
external reviewer bind a review session to that day's visitor hash. Details in
`modules/events/AGENTS.md`.

**Convert components** — the intent-capture surface, each wired to the event stream:
`ConvertForm`, `ConvertExternal`, `ConvertInternal`, `ConvertPricing`, `ConvertSocial`,
`ConvertSocialShare`, and `ConvertRss`.

**Content collections.** Zod schemas — `basePageSchema`, `baseFaqSchema`,
`baseConfigSchema`, `baseNavigationSchema`, `baseTeamSchema`, `bannerSchema` — exported
from `@incubrain/foundry/schemas` and composed in your own `content.config.ts`. Content
lives in markdown and YAML, edited without touching code. `basePageSchema` carries two
optional citation-first fields (see **GEO content guide** below): `answer` (a direct
summary rendered before the body) and `sources` (a visible citation list rendered after
it) — both additive, existing pages are unaffected.

**Page structure.** `default`, `article`, and `landing` layouts selected per route with an
`appLayout` route rule, a catch-all content page, header/footer/banner components, MDC
content components (`AnswerBlock`, `StatGroup`, `CaseStudy`, `ComparisonList`,
`FeatureGrid`, `FounderBio`, `FaqAccordion`), and `SectionWrapper` — an accessible section
primitive that fires a `section_view_<id>` event on intersection.

**Agent-readiness.** `GET /api/_health` — unauthenticated liveness+identity check for
external monitors (Polaris), pure computation with `Cache-Control: no-store`. MCP tools
(`list-pages`, `get-page`, `what-changed`) served by
`@nuxtjs/mcp-toolkit`; the `markdown-rewrite` module (see below); `@nuxtjs/seo`
for sitemap, robots, schema.org, link checking, and canonical redirects; a Satori OG image
component for landing pages.

**Raw markdown.** Every content page also serves its own source, so a coding agent or an
MCP-less LLM can read the document instead of scraping rendered HTML. Two access patterns,
both handled by a Nitro middleware and so live on any Node/Docker/Railway deploy (and in
dev), not just Vercel:

```bash
GET /blog/post.md                          # `.md` suffix (also `/raw/blog/post.md`)
GET /blog/post  -H 'Accept: text/markdown' # content negotiation on the canonical URL
```

Both answer `text/markdown; charset=utf-8` with the file verbatim, frontmatter included —
the source, not a re-render. `Vary: Accept` is set so caches key on the header, and the
`.md` form carries a `Link: <…>; rel="canonical"` back to the HTML route. A `.md` URL with
no content document 404s; `Accept: text/markdown` on a route with no markdown
representation simply falls through to HTML. API, asset, and Nitro-internal routes are
never intercepted. On Vercel the module additionally writes the legacy edge rules that make
`/` serve `llms.txt`.

**RSS.** Config-driven feeds from any content collection — declare `rss: { feeds: {} }` in
your app config and they are served at `/rss/{key}`.

## GEO content guide

Research (Princeton/Georgia Tech) found inline citations, statistics, and named-expert
quotes lift AI-citation rates 22–40% — more than any markup tactic. Nothing here requires
new tooling: it's four content patterns, all optional and additive.

**1. Answer-first structure.** Open a page or section with a direct, quotable answer
before the supporting detail — the shape generative engines lift verbatim.
- Page-level: set `answer` in frontmatter; the `article` layout renders it in an
  `AnswerBlock` before the prose body automatically.
  ```md
  ---
  title: Does Foundry replace Google Analytics?
  answer: No — Foundry streams raw signal for you to interpret; it ships no dashboards.
  ---
  ```
- Mid-article: drop `::answer-block` inline wherever a section needs its own summary:
  `::answer-block{answer="..." label="In short"}`.

**2. Statistics need a named source.** A bare number is a claim; a sourced number is
citable. Use `StatGroup` for a row of stats, each with an optional visible source:
```md
::stat-group
---
stats:
  - value: "22–40%"
    label: AI-citation lift from citation-first content
    source: Princeton/Georgia Tech GEO study
    href: https://example.com/study
---
::
```
Omit `source`/`href` for a plain number — they're optional, but a stat without one is
just decoration.

**3. Named-expert quotes.** `CaseStudy` doubles as the expert-quote pattern: give it
`client` (name + role, `company` optional) and `quote`; add `sourceUrl` (where the quote
was published) to get a semantic `<blockquote cite>` plus a visible citation line. Skip
`partner`/`website` for a bare attributed quote — those are for customer testimonials.

**4. Page-level sources.** Set `sources` in frontmatter (`[{ label, href }]`) for a
whole-page citation list; the `article` layout renders it as a visible, linked list after
the body.

**Checklist before publishing a page you want AI engines to cite:**
- [ ] Does the page (or its key sections) answer the question in the first paragraph?
- [ ] Is every load-bearing statistic attributed to a named, checkable source?
- [ ] Are expert claims attached to a real name and role, not "our team"?
- [ ] Would the page still make sense read with zero JavaScript (SSR-rendered, no
      `<ClientOnly>` around anything a crawler needs)?

## Configuration

```bash
NUXT_SIGNAL_EXPORT_TOKEN=<random-secret>   # bearer token for the export endpoint (unset → 503)
NUXT_PUBLIC_SITE_ID=my-site                # stamped on every signal row (defaults to request host)
NUXT_PUBLIC_SITE_URL=https://example.com   # canonical URL, consumed by @nuxtjs/seo
```

```ts
// nuxt.config.ts
events: {
  signals: { enabled: true, capacity: 100_000, captureErrors: true },
  debug: true,
}
```

Signal rows are held in `useStorage('signals')` — memory by default. Mount
`nitro.storage.signals` to an fs or KV driver to survive restarts.

## Not included

Email sequences, authentication, payment processing, in-product dashboards or charts,
analytics vendor integrations, per-platform webhook notifiers, and an opinionated design
system. Validation captures intent; products deliver value — mixing them creates scope
creep.

## Credits

Foundry's content and layout foundation is adapted from
[Docus](https://docus.dev) ([GitHub](https://github.com/nuxt-content/docus)) by the Nuxt
Content team. i18n was removed — browser-native translation is improving fast and
maintaining translations slows shipping — and signal capture, agent-readiness, and the
export endpoint were added. For Docus-inherited behaviour (MDC components, content
collections, search, theming), the [Docus documentation](https://docus.dev/en) remains a
good reference.

## License

MIT
