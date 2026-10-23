# Debugging a Foundry site

Two runners work against **any** Foundry site URL — the example app, the playground, a consumer
site, or production. Both send `User-Agent: FoundrySmoke/1.0 (+https://github.com/incubrain/foundry)`,
need Node 22 and no extra dependencies, and write to `logs/smoke/` (gitignored).

| Runner | Command | Answers |
| --- | --- | --- |
| HTTP | `pnpm smoke <baseUrl> [--token-env=VAR] [--write] [--sitemap-host-rewrite] [--json]` | Is the server contract right? |
| Browser | `pnpm smoke:browser <baseUrl> [--routes=sitemap\|/a,/b] [--viewports=desktop,mobile] [--max-routes=N]` | Does it render, hydrate and report cleanly? |

Both exit `1` on any `fail` / error-level finding, `2` on bad usage.

## Where to point them

**Local dev server** — start it in its own terminal (Ctrl-C to stop), then run the runner from another.

```bash
pnpm dev:foundry          # examples/foundry on :3000
pnpm dev:playground       # playground on :3100
pnpm smoke http://localhost:3000 --sitemap-host-rewrite
pnpm smoke:browser http://localhost:3000
```

`--sitemap-host-rewrite` matters locally: a site's sitemap names its production host, and without
the flag the HTTP runner would fetch those production URLs (it warns when it sees them). The browser
runner always keeps only the path of each sitemap URL.

**Built preview** — what CI does. The server is started and killed inside one command:

```bash
CI_PRERENDER=true pnpm build:ci:foundry
export NUXT_SIGNAL_EXPORT_TOKEN=local-token
NITRO_PORT=3300 node examples/foundry/.output/server/index.mjs & SERVER=$!; trap 'kill $SERVER' EXIT
until curl -sf http://localhost:3300/api/_health >/dev/null; do sleep 1; done
pnpm smoke http://localhost:3300 --write --token-env=NUXT_SIGNAL_EXPORT_TOKEN --sitemap-host-rewrite
pnpm smoke:browser http://localhost:3300
```

**Consumer site** (`incubrain-website` :3201, `astronera-website` :3202 — see `.claude/launch.json`):
start it with `pnpm --dir <site> dev --port 3201`, then `pnpm smoke http://localhost:3201 --sitemap-host-rewrite`.
To exercise the export, give the site `NUXT_SIGNAL_EXPORT_TOKEN=<x>` and pass `--token-env` with the
same value exported in your shell.

**Production** — read-only:

```bash
pnpm smoke https://foundry.incubrain.org
pnpm smoke:browser https://foundry.incubrain.org --max-routes=5
```

- `--write` is **refused** on non-local hosts (it POSTs `smoke.ping` rows and leaves them in the store).
  `SMOKE_ALLOW_REMOTE_WRITE=1` overrides that for a staging host you own — never for production.
- The browser runner **stubs** `POST /api/_signals/ingest` on remote hosts (fulfilled in the browser,
  never sent), so it proves the client *fires* `ui.page` but not that the server accepts it. Local hosts
  default to `--telemetry=live` (real ingest, response status asserted). Override with `--telemetry=`.
- Page GETs still reach the site, and the server records a `page_request` row for each. See
  "UA classification" below.

## Reading the HTTP report

`logs/smoke/http-<host>-<ts>.json`: one entry per check with `status`, `expected`, `actual`, `ms`.
`pass` = as expected, `warn` = works but is off-contract or unverifiable, `fail` = broken, `skip` = n/a.
The terminal summary lists only warn/fail, fails first.

| Check | Fails / warns when |
| --- | --- |
| `GET /api/_health` | not 200 JSON with `ok/service/version/siteId/timestamp`; warns on empty `siteId`; reports `signals.driver/epoch`, warns on `memory` driver off-localhost |
| `/robots.txt`, `/sitemap.xml` | missing, wrong type, no `Sitemap:`, no `<loc>`; warns if `<loc>` hosts differ from `<baseUrl>` |
| `page:<path>` (each URL, 4 at a time) | not 200 `text/html`, empty `<title>`, error marker (`__NUXT_ERROR`, 5xx payload) = fail; **`<h1>` count other than 1 = warn** (lists the headings) |
| `GET /__foundry-smoke-404-*` | not a 404 with an HTML body |
| `Accept: text/markdown` | not 200 `text/markdown` (warn: negotiation unsupported — `/<page>.md` may still work) |
| `export-auth` | `401` = pass; `503` = warn (export token unset on that site); else fail |
| `export` (`--token-env`) | not 200 `{rows[], cursor:number}`; shows `epoch`/`meta` when present |
| `ingest`, `round-trip`, `ingest-400-*` (`--write`) | marker not visible in export within 10s; malformed body not answered `400` |

## Reading the browser report

`logs/smoke/browser-<host>-<ts>/` holds `report.json`, `summary.md` (table + findings), and a
full-page PNG per route x viewport (`home-mobile.png`). Open the PNG first when a finding is visual.

| Finding | Level | Meaning |
| --- | --- | --- |
| `pageerror`, `console-error` | error | uncaught exception / `console.error` during load |
| `hydration` | error | any console message containing "Hydration" — SSR and client disagree |
| `http`, `request-failed` | error same-origin, warn third-party | a subresource answered `>=400` or failed |
| `overflow` | error on mobile, warn on desktop | `scrollWidth` exceeds the 390px viewport; names the first offending elements |
| `h1` | warn | not exactly one `<h1>` on the rendered DOM — a doubled hero shows as two |
| `telemetry` | error | no `ui.page` row reached ingest within 6s of load (of hydration on a dev server), or ingest answered `>=400` |
| `nav` | error / warn | a header link did not navigate (hash links count: the hash must change), or redirected |

Nav is checked on the first route at desktop width, so a hamburger-only mobile menu is not covered.

### Dev-mode caveats

A Vite dev server (`pnpm dev:playground`, `pnpm dev:foundry`, a consumer's `nuxt dev`) transforms each
module the first time a page asks for it. On a **cold** server the first routes therefore load hundreds
of modules after `load`: the network stays busy for 10s+ (`network-idle` warns) and the app hydrates
late, so `ui.page` can land after the 6s window (`telemetry` error) while the same routes pass on a
warm server or a built preview. The HMR websocket is not the cause (Playwright ignores sockets for
network idle); the pending requests are `/_nuxt/@fs/...` modules.

The browser runner detects a Vite dev server (the document carries `/@vite/client`) and, instead of
network idle, waits for hydration (up to 40s, plus a 500ms settle) and starts the 6s telemetry window
there. It reports `dev server` in the summary and `options.devServer` in `report.json`. A
`dev-hydration` warn means the page never finished hydrating in 40s, which is a real problem.

- A finding that appears on a first (cold) dev run and is gone on a second was compile time. One that
  survives a warm dev server or a `CI_PRERENDER=true pnpm build:ci:foundry` preview is a defect.
- Dev also adds `hints:*` console warnings (nuxt-hints, e.g. html-validate and lazy-load hints) that a
  production build does not emit; judge markup and hydration findings against a built preview too.
- Edit nothing under the site while a run is in flight: HMR and full reloads mid-run produce
  navigations, timeouts and missing `ui.page` rows that are not defects.

## UA classification

`describeVisitor()` (`layer/modules/events/server/utils/visitor-class.ts`) classes a UA as `agent`
(published AI tokens, `HeadlessChrome`, `Playwright`, ...), `bot` (`bot\b`, `crawl`, `curl/`, ...) or
otherwise `human`. `FoundrySmoke/1.0 (+https://github.com/incubrain/foundry)` matches none of those, so
smoke traffic counts as `human` in the signal store (the `--write` run warns `ua-class`). Until
`FoundrySmoke` is added to the automation list in `layer/shared/ai-agents.ts`, filter on
`data.source = "foundry-smoke"` or the `smoke.ping` name, and treat production `page_request` rows from
this UA as smoke noise.
