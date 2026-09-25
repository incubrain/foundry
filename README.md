# Foundry

> A Nuxt 4 layer for standing up a marketing site that streams the full signal of whether
> it is working.

Foundry is the wireframe. You write content, deploy, and wire nothing — the site captures
what visitors do (visits, and intent through the convert components) and what the site
itself reports (errors, warnings), buffers it server-side in one envelope, and hands it to
an external consumer over an authenticated cursor endpoint. We pull it into Polaris; you
can point a Grafana-class puller at the same endpoint. Foundry ends at the stream — no
charts, no dashboards, no anomaly detection inside the site.

The second pillar is **agent-readiness**. Agentic traffic is expected to dwarf human
traffic, so Foundry sites ship MCP tools, `llms.txt`, raw-markdown redirects, and a strong
SEO/OG stack — and every signal row is classified `human | agent | bot` server-side, because
that split is itself signal.

**Stack:** Nuxt 4 · Nuxt Content · Nuxt UI · Tailwind v4 · TypeScript

## Quick start

```bash
npm install @incubrain/foundry
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: ['@incubrain/foundry'],
})
```

```bash
# .env — this is the entire required surface
NUXT_SIGNAL_EXPORT_TOKEN=<random-secret>   # bearer token for the export endpoint
NUXT_PUBLIC_SITE_ID=my-site                # optional — defaults to the request host
```

Write content under `content/`, deploy, point your consumer at
`/api/_signals/export`. See `examples/foundry` for a complete app.

## Signal architecture

Everything the site captures — analytics events *and* error/warning logs — becomes one
`SignalRow` in a capped server-side ring buffer. Nothing is pushed anywhere. An external
consumer pulls with a cursor.

```
client events  → signal provider ─┐
client errors  → errors.client ───┼→ POST /api/_signals/ingest ─┐
                                  │                             ├→ ring buffer (unstorage)
form captures  → /api/v1/webhook ─┘                             │        ↓
server errors  → signal-errors plugin ──────────────────────────┘   GET /api/_signals/export
                                                                    ?since=<seq>&limit=<n≤2000>
                                                                    → { rows, cursor, site }
```

**The envelope** — one shape for both kinds:

```ts
SignalRow {
  id, seq, ts, site,
  kind: 'event' | 'log',
  name,
  severity?,   // logs
  visitor?,    // { class: 'human' | 'agent' | 'bot', ... } — stamped server-side
  page?, referrer?, utm?,
  review?,     // ?polaris_review=<token> — this page load only, never persisted
  data?
}
```

- **Client events** go through `useEvents()` → the signal provider → a debounced batch
  queue, flushed with `sendBeacon` on `pagehide`.
- **Identity events** are always on for every visitor: `ui.click` (`{ target, label?,
  section? }`), `ui.section` (`{ section, visible }`), and `ui.page` (`{ from? }`). They are
  content-free by construction — authored element identity and labels only, never pixel
  coordinates, input values, or keystrokes. Sections are named by `data-section` or a plain
  `<section id>`; `SectionWrapper` stamps it for you. `data-signal-ignore` excludes a subtree.
- **Client errors** (`window.onerror`, `unhandledrejection`, Vue `errorHandler`) land in the
  same stream as `kind: 'log'` rows. So do Nitro request errors, server-side.
- **Form captures** POST to `/api/v1/webhook` (historical route name — it is the
  form-capture endpoint, not a webhook sender), pass honeypot/timing and zod validation, and
  land as a `form_submitted` row. The server is the durable capture point.
- **Visitor class** is derived from the request `User-Agent` on every ingest path. A
  client-supplied value is always overwritten, never trusted.
- **Cursor:** `seq` is monotonic; consumers send back the last `cursor` they saw.

Pulling the stream:

```bash
curl -H "Authorization: Bearer $NUXT_SIGNAL_EXPORT_TOKEN" \
  "https://your-site.com/api/_signals/export?since=0&limit=500"
# → { rows: [...], cursor: 512, site: "my-site" }
```

The endpoint fails closed: with `NUXT_SIGNAL_EXPORT_TOKEN` unset it returns 503, never open
data. Rows live in `useStorage('signals')` — memory by default, 100 000 rows, oldest
evicted. Mount `nitro.storage.signals` to an fs/KV driver if they must survive a restart.

## Agent-readiness

| Surface | What ships |
|---|---|
| `/api/_health` | Unauthenticated liveness+identity check for external monitors (Polaris): `{ ok, service: 'foundry', version, siteId, timestamp }`, `Cache-Control: no-store`. Pure computation — no storage or content access. |
| MCP tools | `list-pages`, `get-page`, `what-changed` — auto-registered from `server/mcp/tools/`, served by `@nuxtjs/mcp-toolkit`. Visit `/_mcp/tools` in dev to verify. |
| `llms.txt` | `/llms.txt` + `/llms-full.txt` ship by default via `nuxt-llms` (a real layer dependency, zero config); sections auto-populate from your content collections. Override with an `llms:` config in your app — see `examples/foundry/nuxt.config.ts`. |
| Raw markdown | The `markdown-rewrite` module writes Vercel edge redirects so `Accept: text/markdown` or a `curl/*` UA on a page URL serves `/raw/<path>.md`, and `/` serves `llms.txt`. No-op off Vercel and in dev. |
| SEO / OG | `@nuxtjs/seo` (sitemap, robots, schema.org, link checker, canonical redirects) plus a Satori OG image component for landing pages. |
| RSS | Config-driven feeds from any content collection — `rss: { feeds: {} }` in your app config, served at `/rss/{key}`. |

## Content and components

Content is YAML and markdown, edited by whoever owns the site — not code. The layer exports
zod schemas you compose in your own `content.config.ts`:

```ts
import { basePageSchema, baseFaqSchema, baseConfigSchema, baseNavigationSchema }
  from '@incubrain/foundry/schemas'
```

```
content/
├── pages/          Markdown pages (basePageSchema)
├── faq/            FAQ entries (baseFaqSchema)
└── config/
    ├── site.yml    Site config (baseConfigSchema)
    └── navigation.yml
```

`baseTeamSchema` and `bannerSchema` are exported too.

**Sections are deliberately minimal.** The layer ships `SectionWrapper` — an accessible
`UPageSection` wrapper that emits a `section_view_<id>` event on intersection and sets
`data-testid`. Concrete sections (Hero, Offer, …) live in your app, not the layer: an
opinionated design system is out of scope on principle.

**Convert components are the intent-capture surface** — the place where a visit becomes a
signal worth acting on:

| Component | Captures |
|---|---|
| `ConvertForm` | Email / lead capture → `/api/v1/webhook` |
| `ConvertExternal` | Outbound clicks (Stripe, LemonSqueezy, Cal.com) |
| `ConvertInternal` | Internal CTA clicks |
| `ConvertPricing` | Pricing interaction |
| `ConvertSocial` | Social profile clicks |
| `ConvertSocialShare` | Share actions |
| `ConvertRss` | Feed subscriptions (rss module) |

Three layouts ship: `default`, `article`, `landing` — selected per route with an
`appLayout` route rule.

## Configuration reference

**Environment**

| Variable | Purpose |
|---|---|
| `NUXT_SIGNAL_EXPORT_TOKEN` | Bearer token for `GET /api/_signals/export`. Unset → 503. |
| `NUXT_PUBLIC_SITE_ID` | Site identifier stamped on every row. Defaults to the request host. |
| `NUXT_PUBLIC_SITE_URL` | Canonical site URL, consumed by `@nuxtjs/seo`. |

That is the signal surface in full. A third signal env var means a feature that does not
capture signal.

**Module options** (`nuxt.config.ts`)

```ts
events: {
  signals: {
    enabled: true,        // signal capture on/off
    capacity: 170_000,    // ring buffer size (14 days)
    captureErrors: true,  // client errors → the stream
  },
  debug: true,            // echo events to the console in dev
}
```

## Repo map

```
layer/              The Nuxt layer — published as @incubrain/foundry
  app/              Components, composables, layouts, pages
  modules/          events (signal capture), rss, markdown-rewrite, config, css
  server/           MCP tools, content API, caching
examples/foundry/   Reference app — the one to copy
playground/         Test harness (unit + nuxt + e2e specs)
deploy/             vercel.website.json (Dockerfile in examples/foundry)
```

## Development

```bash
pnpm dev             # layer dev server
pnpm dev:foundry     # example app
pnpm test            # vitest (specs live in playground/test)
pnpm verify          # lint + typecheck
pnpm build           # build the layer
```

Releasing is documented in [RELEASING.md](RELEASING.md).

## Not included

Validation is not product. These are out, and staying out:

- **Email sequences** — capture intent here, deliver with ConvertKit/Mailchimp
- **Authentication** — an anonymous ID is enough to capture signal
- **Payment processing** — external links prove payment intent
- **Dashboards and charts** — the consumer owns interpretation; Foundry ends at the stream
- **Analytics vendors** — no Umami/GA integration; pull the buffer instead
- **Outbound webhook notifiers** — no per-platform Slack/Discord/Telegram formatters; a
  second destination means a second source of truth
- **Drain-adapter observability pipelines** — errors ride the signal stream, not a parallel
  log pipe
- **An opinionated design system** — AI makes design cheap; hard-coding taste into a
  wireframe is a liability

## Links

- [GitHub Issues](https://github.com/incubrain/foundry/issues)
- [Discussions](https://github.com/incubrain/foundry/discussions)

## License

MIT
