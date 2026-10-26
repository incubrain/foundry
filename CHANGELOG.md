# Changelog

## [0.10.0](https://github.com/incubrain/foundry/compare/v0.9.0...v0.10.0) (2026-10-26)

### Features

* **blog:** baseBlogSchema, scheduling core and the foundry-blog writer (product-validator-3bd.1) ([deeab39](https://github.com/incubrain/foundry/commit/deeab39e66f9b5c26c0bf3d13bb62b1b52fcc3c9))
* **blog:** the /blog module, leak guards, example app and docs (product-validator-3bd.1) ([c3e7358](https://github.com/incubrain/foundry/commit/c3e7358032cea0ac6b1aa6797917ec4f693f4b66))
* **debug:** http + browser smoke runners, e2e CI job, built-output smoke (product-validator-4n6.4) ([e3c7446](https://github.com/incubrain/foundry/commit/e3c7446c4d759346950675e8cec68e1883437a26))
* **events:** buffer epoch, export meta, health lineage, boot report; server-assigned row ids (product-validator-4n6.2) ([877d6c9](https://github.com/incubrain/foundry/commit/877d6c93418f6dbeb944168ffed17082be00630c))

### Bug Fixes

* **content:** make the page hero opt-in (hero defaults to false) ([d0b40c6](https://github.com/incubrain/foundry/commit/d0b40c67a57da445cc75510ea17388c021eb3ba2))
* **css:** use Tailwind's system font stacks instead of the layer's ([d45d24a](https://github.com/incubrain/foundry/commit/d45d24ad9f36f035f151a35ff52fa90a80198f43))
* **deps:** clear 74 of 82 Dependabot alerts via pnpm overrides and lockfile re-resolve ([cca7201](https://github.com/incubrain/foundry/commit/cca72014aeeb0b5911fca2964ce268998ca1daeb))
* **dev:** clear dev-surface noise in playground smoke runs ([0b919c4](https://github.com/incubrain/foundry/commit/0b919c449627536bf9040aa21b4308d3369c9276))
* **events:** report client delivery failures, truncate page/referrer, dev-only debug echo ([4c01703](https://github.com/incubrain/foundry/commit/4c01703b714f592d29522d498f7e90ffc19cc250))
* **events:** stop 4xx server_error noise, record ingest rejections, correlate rows by request id ([cbb0c67](https://github.com/incubrain/foundry/commit/cbb0c670260eeffe0181b1ff916d9f5080fd3b0d))
* **example:** teleport SignalToasts into [#teleports](https://github.com/incubrain/foundry/issues/teleports) to stop the landing-page hydration mismatch ([52567ad](https://github.com/incubrain/foundry/commit/52567adb6191c31acfcb369e1e1630bceceade66))
* **smoke:** local runs rewrite sitemap hosts by default so they never test production ([dc4d24d](https://github.com/incubrain/foundry/commit/dc4d24dc1b41b43650007fff289fd2fce6139e07))
* **visitor:** class the FoundrySmoke runners as automation, not human ([9f53cb3](https://github.com/incubrain/foundry/commit/9f53cb36fb629dfec71edf4e29cc3e134de89dc5))

### Performance Improvements

* **css:** compile Tailwind once per site ([ec21890](https://github.com/incubrain/foundry/commit/ec2189095e9326f4e3d7993164dca0f8ccca5ae4))
* **header:** CSS transition for the menu toggle, drop motion-v ([80d7a4c](https://github.com/incubrain/foundry/commit/80d7a4c415672c66d9fc67725f580653e3141282))

## [0.9.0](https://github.com/incubrain/foundry/compare/v0.8.0...v0.9.0) (2026-09-25)

### Features

* **a11y:** add axe-core WCAG A/AA gate over playground rendering routes (product-validator-m0f.10) ([a5d1829](https://github.com/incubrain/foundry/commit/a5d1829890b216928aa0f1dff8551ce117efb133))
* **events:** capture page visits server-side so non-JS crawlers leave signal (product-validator-m0f.3) ([71a51e3](https://github.com/incubrain/foundry/commit/71a51e3bd93ac858d21a61e884bd2c44e631b80f))
* **events:** cookieless daily-salted visitor hash replaces stored visitor ID (product-validator-ev2.3) ([37b8c55](https://github.com/incubrain/foundry/commit/37b8c55df2d1db3fcf3266be015d85fbafd301db))
* **events:** emit ui.outbound Site Events for outbound links and downloads ([ceceeef](https://github.com/incubrain/foundry/commit/ceceeef5ef79c0f44d4335924f0dda8c4048faeb))
* **events:** identity events + Polaris review binding in the signal stream ([7ac07dc](https://github.com/incubrain/foundry/commit/7ac07dc1edc01a4103f46e4a029d4820a416c34a))
* **events:** persist Site Events on a Railway Volume with 14-day retention ([acae801](https://github.com/incubrain/foundry/commit/acae8016feb747737b4b654980b891277d049d4f))
* **events:** record 404s as http.not_found Site Events ([8e3cadb](https://github.com/incubrain/foundry/commit/8e3cadb6247ff6b461392188b46b68944dedf287))
* **events:** stamp signal rows with env:'local' in dev mode ([a2ca2b4](https://github.com/incubrain/foundry/commit/a2ca2b4496e955dbfe65fe036b267e65d77e9e38))
* **events:** stamp visitor device, browser and OS server-side (product-validator-ev2.4) ([19dc964](https://github.com/incubrain/foundry/commit/19dc9646eee1c6fa0eb939f36389084989cb3429))
* **events:** sub-classify agent traffic by fetch purpose (product-validator-m0f.2) ([38dcd90](https://github.com/incubrain/foundry/commit/38dcd906adbc448366e86af2e3824a75c2a3a338))
* **geo:** citation-first content patterns — answer-first, sourced stats, expert quotes (product-validator-m0f.7) ([8ece233](https://github.com/incubrain/foundry/commit/8ece233fc58cc4c0d4c0fbfa983df78f8f0798ea))
* **llms:** ship llms.txt + llms-full.txt from the layer by default (product-validator-m0f.9) ([30846e4](https://github.com/incubrain/foundry/commit/30846e4abe61f154067a8969cbe51c912f5d8c0b))
* **markdown:** serve raw markdown on any Nitro deploy (product-validator-m0f.8) ([5f62338](https://github.com/incubrain/foundry/commit/5f623380c34b9db23cd9ec54ced31292e4acc9c9))
* **seo:** emit FAQPage and Organization JSON-LD from existing content (product-validator-m0f.6) ([59d3e43](https://github.com/incubrain/foundry/commit/59d3e4311dc47ac6dd67a36c5db44a380378b5e7))
* **server:** add /api/_health liveness endpoint for Polaris monitoring ([f1804c9](https://github.com/incubrain/foundry/commit/f1804c9c0f24bad871687112d65ded75c41a905e))
* **signal,seo:** capture MCP tool calls + ship a deliberate AI-crawler robots policy ([237cf00](https://github.com/incubrain/foundry/commit/237cf004ca4685a3688573607edaca28e523647d))
* **site:** PLATE IV — live tail of the page's own signal emissions ([8803ed1](https://github.com/incubrain/foundry/commit/8803ed109443694e7581605b5daa49e44ad27bd3))
* **site:** rebuild foundry.incubrain.org as The Station Record — agent-first one-pager ([f9961e3](https://github.com/incubrain/foundry/commit/f9961e382dc5e660ab694ceb007d03ed1b251d4d))

### Bug Fixes

* **deps:** resolve 112/113 Dependabot alerts via dedupe + targeted overrides ([48d3501](https://github.com/incubrain/foundry/commit/48d35019e0f85b8ed4c25cc88d86a24ccf8b694f)), closes [#265](https://github.com/incubrain/foundry/issues/265)
* **deps:** resolve 4 moderate Dependabot alerts in transitive deps (product-validator-8x2) ([1704af3](https://github.com/incubrain/foundry/commit/1704af3da20a706da22ae70cf1bf7291e68ff961))
* **deps:** restore pre-dedupe lockfile graph — ebi.3's regenerated lockfile broke @nuxt/test-utils h3-next resolution (16 unit files failed to spawn); minimal @unhead/vue-only delta instead. Plus beads ledger export. ([b716885](https://github.com/incubrain/foundry/commit/b716885969f88dad4fd3d6bae0b3e854f1d96441))
* **docker:** example image never installed the workspace layer ([50e8809](https://github.com/incubrain/foundry/commit/50e8809047592c52f0851bfdc9b75be1ddf676e2))
* **events:** count agent-native document requests as page_request signals (product-validator-m0f.15) ([892a958](https://github.com/incubrain/foundry/commit/892a958c66f733c963d320dfa826a9df6e71f914))
* **layer:** align searchable config schema to the flat shape useSearch reads ([5832497](https://github.com/incubrain/foundry/commit/583249723870e7b87f84d808453d1eef8e7689ff))
* **layer:** pass UPageHeader title via prop to eliminate hydration mismatch (product-validator-740) ([2f06951](https://github.com/incubrain/foundry/commit/2f069510c308b35149df1d004c459360977afdd9)), closes [#title](https://github.com/incubrain/foundry/issues/title)
* **layer:** re-add explicit @unhead/vue dependency to resolve peer ambiguity ([154576f](https://github.com/incubrain/foundry/commit/154576fe06f3531c7f61d26d82f7739529fe7cd3))
* **layer:** ship the AppConfig type augmentation to consumer typechecks ([1482ed7](https://github.com/incubrain/foundry/commit/1482ed7f873704bcfb016a03b71856864f2e23cc))
* **layer:** SSR the ConvertInternal offer query + add no-JS content regression net (product-validator-m0f.4) ([92b594c](https://github.com/incubrain/foundry/commit/92b594cf7651e127bc0804ea28c951b41cc29306))
* **layer:** stop shipping type errors into consumer typechecks ([3d3c5cd](https://github.com/incubrain/foundry/commit/3d3c5cd4cf8839fcb986117715d683e62713b47e))
* **layout:** move UPageHero from default layout into catch-all page (product-validator-s5s) ([30e2c43](https://github.com/incubrain/foundry/commit/30e2c431b6bc9c3219db31929e501bd50619f648))
* **signal:** count cached MCP tool calls in the signal stream (product-validator-m0f.13) ([4918c6b](https://github.com/incubrain/foundry/commit/4918c6bc4c08a12ce26f6339687012adf29b831b))

## [0.8.0](https://github.com/incubrain/foundry/compare/v0.7.2...v0.8.0) (2026-08-20)

### Features

* add VISION.md — project vision relocated from _knowledge/visions (schema v2) ([726c9f1](https://github.com/incubrain/foundry/commit/726c9f137d5d994aea626479a241ecf5d3282d30))
* unified signal buffer + authenticated export endpoint; errors into signal stream; minimal section set (product-validator-a4r.8/.9/.16) ([1a9df90](https://github.com/incubrain/foundry/commit/1a9df901a0277d92c7d258293fbb85e12aeff858))
* visitor classification (human/agent/bot) on signal rows; starter Offer section (product-validator-a4r.10) ([28646bd](https://github.com/incubrain/foundry/commit/28646bdf52d27510eb06e9f50a893e613a41600c))

### Bug Fixes

* **example:** pass STATUS_ICONS .name string to UIcon (icons failed to render); add browser launch config ([8b57342](https://github.com/incubrain/foundry/commit/8b573422335f5ee5abc0d82c6064dfbf4a1c01d4))
* pin h3@1.15.11 in layer to resolve dual-h3 type mismatch; verification pass green (lint 0, typecheck 0, 81/81 tests, build ok) ([ba94e81](https://github.com/incubrain/foundry/commit/ba94e81c92a92a8d30a0de66cc4d8c335980434a))

### Removed (breaking if you used these surfaces)

*Added post-release: the auto-generated notes above only picked up `feat:`/`fix:` commits and missed the refocus removals. Shipped as a 0.x minor per pre-1.0 convention.*

* **CLI package** — `cli/`, `create-foundry`, and the `.starters/default/` scaffolding ([916ddb7](https://github.com/incubrain/foundry/commit/916ddb7))
* **Analytics & webhook notification machinery** — umami/console providers, Discord/Slack/Telegram formatters, webhook retry, anti-spam util; events collapsed to the single signal provider ([916ddb7](https://github.com/incubrain/foundry/commit/916ddb7), [1c6fffe](https://github.com/incubrain/foundry/commit/1c6fffe))
* **`evlog` module & dependency** — errors now flow through h3 `createError` and the signal buffer's Nitro error hook ([916ddb7](https://github.com/incubrain/foundry/commit/916ddb7))
* **`changelog` module + KaTeX math pipeline** ([6de1cc5](https://github.com/incubrain/foundry/commit/6de1cc5))
* **`decisions` / founder-decision-log feature** — including the `list-decisions` and `get-decision` MCP tools; remaining MCP tools are `list-pages`, `get-page`, `what-changed` ([2636669](https://github.com/incubrain/foundry/commit/2636669), [1c6fffe](https://github.com/incubrain/foundry/commit/1c6fffe))
* **`foundry-register` Nitro plugin** — the mentorship-network phone-home (`NUXT_FOUNDRY_REGISTER`) and its `foundryRegister` runtimeConfig key ([33e847d](https://github.com/incubrain/foundry/commit/33e847d))
* **Env surface collapsed** — runtime env vars are now `NUXT_SIGNAL_EXPORT_TOKEN` and `NUXT_PUBLIC_SITE_ID` (plus `NUXT_PUBLIC_SITE_URL` for SEO)

### Changed

* **`docs` module extracted** to the separate `@incubrain/foundry-docs` package ([a1be8fc](https://github.com/incubrain/foundry/commit/a1be8fc))

## [0.7.2](https://github.com/incubrain/foundry/compare/v0.7.1...v0.7.2) (2026-05-22)

### Bug Fixes

* **layer:** use literal query values in useFetch to stop SSR recursion ([0c8dd4f](https://github.com/incubrain/foundry/commit/0c8dd4f32648b51c8eafc938576848d9412e8a89))

All notable changes to this project will be documented in this file.

## [0.7.1] - 2026-05-21

### Added

- **Sticky-footer pattern in `app.vue`** — `min-h-screen flex flex-col` wrapper with `flex-1` on the layout slot keeps the footer pinned to the viewport bottom while `<NuxtPage>` is empty or pending. Fixes the "footer rendered above content" symptom on SPA routes (`ssr: false`) and pages with heavy async setup — e.g. astronera's `/viirs/maharashtra` map page
- **`routeRules.appLayout` runtime bridge** — new global middleware (`app/middleware/app-layout.global.ts`) reads `getRouteRules({ path }).appLayout` and calls `setPageLayout()`. Nuxt 4 type-augments the field but ships no runtime handler; layouts now actually swap per `routeRules` mapping without each consumer wiring their own middleware
- **Server-side content endpoints** — `/api/_foundry/content/page` and `/api/_foundry/content/surround` are the single typed boundary for content lookups. Layouts and the catch-all consume them via `useFetch`. Side benefit: ready hook point for future caching, auth, or rate-limiting around content access
- **`ContentDoc` type** — exported from `useContentPage`. Minimal shape (title, description, hero, label, date, image, path, seo) intersected with `Record<string, unknown>` for arbitrary frontmatter
- **`modules/markdown-rewrite.ts` shipped in tarball** — was missing from `layer/package.json` `files:` array. Consumers using the layer's Vercel edge-redirect module now have the file present
- **Playground rendering test matrix** — 17 E2E tests in `playground/test/e2e/rendering.e2e.spec.ts` cover default SSR, SPA-only routes, app-page vs content precedence, dynamic params, `<ClientOnly>` islands, `routeRules` (headers/redirect/appLayout), structural DOM order, and content/app-page layout equivalence. Run with `pnpm --filter playground test:e2e`
- **Rendering-modes documentation** — `examples/foundry/content/docs/5.advanced/4.rendering-modes.md` documents URL → page resolution order, layout selection rules, every rendering knob, real-world consumer patterns, and debugging tips
- **Local registry workflow (verdaccio)** — `.verdaccio/config.yaml` + `layer/scripts/publish-local.sh` + root `verdaccio:start` / `layer:publish:local` scripts. Enables testing local layer changes in external consumer repos (astronera, incubrain). Documented in `AGENTS.md`

### Changed

- **Layouts decoupled from content existence** — `default`, `landing`, `article` no longer call `throw createError(404)` when content is missing. App pages that opt into a Foundry layout (`definePageMeta({ layout: 'article' })`) no longer 404 unless they explicitly set `layout: false`. Both incubrain and astronera previously worked around this by setting `layout: false` on every hand-built app page
- **Catch-all owns the 404** — `layer/app/pages/[...slug].vue` does `getPage()` + `setContext()` + the 404 throw. Layouts fetch their own copy via the same `useFetch` key (deduped) so SSR has page data at layout-render time. Previously each layout fetched independently and threw separately
- **`useContentPage.getPage()` uses `useFetch`** — talks to `/api/_foundry/content/page` instead of calling the auto-imported `queryCollection` directly. Sidesteps a dev-mode crash (`event.req.headers.entries is not a function`) under our pinned h3@1 + `@nuxt/content@3.13`
- **`as any` casts replaced with typed Content shapes** — 15 usages across `useContentPage`, layouts, the catch-all, the appLayout middleware, and the server endpoints now use `ContentDoc`, `keyof PageCollections`, `ContentNavigationItem`, and Nuxt's `LayoutKey` parameter inference

### Fixed

- **`UPageHero` 0.10 CLS on content-driven pages** — layouts used to read from a shared context that the catch-all populated *inside* its slot, AFTER the layout's render committed. SSR emitted no hero (`v-if` false); client hydrated with hero (`v-if` true); body shifted 448px. Both layouts and the catch-all now fetch via the same dedupe key, so SSR and CSR render identical HTML. Measured drop from CLS 0.102 → 0.0004 on `/render-landing`, 0.076 → 0.0003 on `/render-default`
- **Footer rendering above content on SPA / async-pending routes** — see Added: sticky-footer pattern in `app.vue`
- **`routeRules.appLayout` was a silent no-op** — see Added: runtime bridge middleware
- **Root `/` URL 404 in the catch-all** — `useContentPage.getPage()` stripped the trailing slash from `/` into an empty string, causing `queryCollection.path('').first()` to return null. Now preserves the root slash so the catch-all correctly serves `content/pages/index.md`

### Known issues

- **`pnpm verify` typecheck failures unrelated to this release** — 10 pre-existing TypeScript errors block the verify gate (h3 v1/v2 type drift in `modules/rss/server`, `server/mcp/tools/list-pages.ts`, `server/middleware/docs-redirect.ts`; `event.node` possibly-undefined access in `app/utils/prerender.ts`; missing `toc` prop type in `modules/docs/runtime/layouts/docs.vue`). 0.7.0 shipped past these as well. Tracked in `bd:product-validator-o3q`; will be addressed alongside the deferred Nitro v3 / h3@2 / unhead@3 cascade. 0.7.1 was released by bypassing the verify hook (`release-it --no-before-init` or equivalent)

## [0.7.0] - 2026-03-24

### Added

- **MCP tools for decisions & change detection** — `list-decisions`, `get-decision` query the changelog collection; `what-changed` returns SHA-256 content hashes across docs + changelog for efficient remote polling with optional `since` filter
- **Content hash enrichment** — `list-pages` and `get-page` MCP tools now include `contentHash` (SHA-256 of raw markdown) enabling remote systems to detect content changes without re-fetching
- **Content-hash utility** — `computeContentHash()` server utility for SHA-256 fingerprinting of content
- **Auto-registration plugin** — Nitro plugin that registers Foundry sites with the Incubrain mentorship network on production startup (`NUXT_FOUNDRY_REGISTER=true`); sends site URL, MCP endpoint, and available RSS feeds
- **12 background utilities** — 6 theme-aware patterns (`bg-pattern-grid`, `grid-sm`, `grid-lg`, `dots`, `diagonal`, `cross`) and 6 gradients (`bg-gradient-radial-primary`, `radial-secondary`, `fade-t`, `fade-b`, `spotlight`, `mesh`) using Nuxt UI semantic CSS variables; automatically follow app theme overrides
- **Animation utilities** — `perspective-1000` and `animate-bounce-slow` extracted from Hero components into reusable layer utilities
- **Page & layout transitions** — CSS opacity transitions (150ms page, 200ms layout) matching the `out-in` transition names in nuxt.config
- **Unit tests** — 32 new tests for content-hash utility, RSS XML generation (`escapeXml`, `buildRSSFeed`), and webhook formatters (Discord, Slack, Telegram); total test count: 86

### Changed

- **`useContentPage()` context lifecycle** — Context is no longer eagerly cleared on route change; old content persists until the new layout calls `setContext()` with fresh data, eliminating the blank flash between layouts
- **Hero components refactored** — Foundry and Incubrain Hero components now use layer background utilities (`bg-gradient-radial-primary`, `bg-pattern-grid`) instead of duplicated scoped CSS

### Fixed

- **Layout flickering on cross-layout navigation** — Removed eager `context.value = null` watcher in `useContentPage` that caused blank renders during layout transitions; combined with new transition CSS for smooth opacity fades

## [0.6.1] - 2026-03-12

### Fixed

- **Inline minimark error** — removed minimark dependency

## [0.6.0] - 2026-02-27

### Added

- **RSS module** — Config-driven RSS feed generation from Nuxt Content collections; register feeds in `nuxt.config.ts` with field mapping
- **Changelog module** — Timeline component for versioned changelog entries with author resolution from team collection
- **Docs module** — Glossary terms (`Defn`), inline citations (`Cited`), bibliography, full-text search, and 3-column docs layout; all features toggleable via config
- **Docs navigation middleware** — Auto-redirect to first child page when visiting a docs section root
- **SectionWrapper `reverseBelow` prop** — Responsive layout reversal using VueUse breakpoints; sections stack in reverse order on mobile
- **Webhook retry utility** — Exponential backoff with jitter for webhook delivery
- **CLI copy-list system** — Post-scaffold fetching of shared config files from GitHub with path traversal prevention
- **CLI test suite** — Unit tests for scaffolding and argument parsing
- **Comprehensive documentation** — 9 sections (50+ pages) covering getting started, content, signal capture, theming, advanced, testing, deployment, reference, and modules
- **Starter template enhancements** — Split Hero into sub-components, added app.config.ts, team content, devDependencies for testing
- **CI starter build job** — Validates the scaffolded starter template builds end-to-end

### Changed

- **Modular architecture** — Extracted RSS, Changelog, and Docs from layer root into isolated opt-in Nuxt modules under `modules/`
- **Icon packages** — Replaced monolithic `@iconify/json` with individual `@iconify-json/lucide` and `@iconify-json/simple-icons` (peer dependencies)
- **Console → evlog** — All remaining `console.*` calls replaced with evlog structured logging
- **CaseStudy border tokens** — `border-neutral-800` → `border-default` for correct light/dark mode
- **Footer components** — AppFooterBottom and AppFooterLeft restructured
- **MCP tools** — `get-tools.ts` renamed to `get-page.ts`
- **Webhook handler** — Significant rework of `webhook.post.ts` with improved formatting
- **Starter dependency** — Pinned `@incubrain/foundry` to `^0.6.0` (was `latest`)
- **CLI default directory** — `my-funnel` → `my-project`
- **CI security** — Pinned GitHub Actions to commit SHAs
- **Dependencies** — VueUse 14.2.1, minimark 1.0.0, MCP toolkit 0.7.0, Nuxt Content 3.11.2

### Fixed

- **Dynamic Tailwind classes** — PageSplit uses static class map instead of template literal interpolation, preventing build-time purging
- **Citation ID handling** — Fixed citation reference resolution
- **Docs redirect middleware** — Path handling fix
- **CLI input validation** — Added path traversal prevention, repo/ref/path validation (CodeQL alert fix)
- **Lint errors** — Resolved all lint errors across layer and CLI

### Removed

- **InlineTest component** — Removed test component from published package
- **Legacy RSS files** — `convert/Rss.vue`, `useRssFeed.ts`, `rss.handler.ts` moved to RSS module
- **Legacy logger** — `server/utils/logger.ts` replaced by evlog
- **Legacy config resolver** — `shared/config-resolver.ts` removed
- **Starter Dockerfile** — Removed `deploy/Dockerfile.starter`

## [0.5.2] - 2026-02-16

### Added

- **Package exports** — `@incubrain/foundry/schemas` export enables consumers to import content collection zod schemas directly instead of redefining them; wildcard `./*` export preserves deep imports
- **evlog structured logging** — AI-friendly error context with `why`/`fix` fields, enrichment plugin (user agent + geo), tail sampling plugin, and browser transport
- **evlog drain scaffolding** — `createDrainPipeline()` for batching
- **CI pipeline** — Lint, typecheck, and build diagnostics for AI agent observability
- **Team collection** — `baseTeamSchema` in layer content collections

### Changed

- **Content collection schemas deduplicated** — Examples now import schemas from layer via `@incubrain/foundry/schemas` instead of copy-pasting definitions
- **Type declarations consolidated** — Moved type declarations into `shared/types/` for single source of truth
- **Component logic extracted to composables** — `useChangelog`, `useFormCapture`, `useRssFeed`, `useSocialLinks`, `useSocialShare`, `useSourcesTable`
- **Console replaced with evlog** — All `console.*` calls replaced with evlog browser transport for structured logging
- Removed `useContentCache` composable in favour of direct content queries with camelCase yml items
- Removed old starter example (lives inside `.starters/*` now)
- Renamed project from "Founder Funnel" to "IncuBrain Foundry"

### Fixed

- **Zero typecheck errors** — Resolved all type errors across layer, shared files, and module declarations
- **All lint errors resolved** — Enforced lint in CI
- **All broken content links resolved** — Re-enabled `failOnError` in CI for link checker and prerender
- Normalised URL path handling in `useContentPage` and `useContentConfig`
- Changelog/decisions items loading with consistent `useContentConfig.collections` data fetching
- Dark/light mode issues in FAQ accordion and default layout
- Removed duplicate SEO modules already included with `@nuxtjs/seo`
- OG image, IPX, and decisions routes excluded from prerender to avoid CI failures
- evlog auto-imports and RSS `include` pattern extended to `/rss/**`

## [0.5.1] - 2026-02-03

### Fixed

- Citations handle missing IDs gracefully
- Internal linking no longer incorrectly prefixes docs path to page links
- `useCitations` reactivity with computed get/set state
- Page data loads correctly based on layout
- `SectionWrapper` forwards slots with scope for Nuxt Studio UI detection
- `addServerHandler` requires explicit method
- Rename `ProseCite|ProseDfn` to `Cited|Defn` (Nuxt Studio inline prose workaround)

### Changed

- Replace heroicons with Lucide icons
- Bump Nuxt to 4.3.0
- Bump Nuxt Studio to 1.2.0
- Add "Built with @incubrain/foundry" to footer

## [0.5.0] - 2026-01-31

First npm release as `@incubrain/foundry`.

### Added

- **npm package** — Install via `npm install @incubrain/foundry`
- **CLI** — `npx create-foundry` scaffolds new projects
- **Authority docs** — Citations, cross-linking, bibliography, MCP integration
- **ProseCite/ProseDfn** — Inline citation and term definition components
- **PageHeroWrapper/PageSplit** — Better MDC syntax support and layout flexibility
- **UCarousel slots** — Slot support using `cloneVNode` and `useSlots`
- **Dynamic navigation** — Auto-generated from content pages
- **Content collections** — Extensible via `zod.merge()`
- **Nuxt LLMs** — Better LLM discovery for docs
- **RSS feeds** — Dynamic generation with collection handlers

### Changed

- Rebrand from "Founder Funnel" to "Foundry"
- Fork docus, remove i18n and feature bloat
- Restructure repo for npm publish (layer/, examples/, cli/)
- Move layer deps from root to layer/package.json
- Reduce bundle size by 10MB (remove default icons, lazy-load KaTeX)
- Simplify events system
- Consolidate layouts from 6 to 4
- Content-driven website using Nuxt Content catchall pages

### Fixed

- Citations and bibliography rendering
- HMR issues with vibekanban branches
- Prettier pnpm workspace resolution
- Dockerfile copying correct directories

### Removed

- Dependabot (more noise than value)
- One-click deploy (replaced with repo-sync)
- QR code function (use dub.co instead)
- Team collection complexity
