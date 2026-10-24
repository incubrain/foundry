# Events Module — AI Agent Instructions

Signal capture. One pipe: client event → `events:track` hook → signal provider →
`/api/_signals/ingest` → capped ring buffer → external consumer pulls
`/api/_signals/export`. There are no analytics providers, no outbound webhooks, and no
logging library for signals — anything that isn't the signal pipe was removed on purpose.
(The one `consola` logger tagged `foundry` only prints the startup report and buffer
failures to the operator's console — see "Boot report".)

## File Map

```
layer/modules/events/
├── index.ts                          # Module setup (auto-imports, routes, plugins)
├── runtime/
│   ├── types/
│   │   ├── events.ts                 # Event types, interfaces, module options
│   │   └── signal.ts                 # SignalRow envelope (events AND logs), export/meta types, SIGNAL_TEXT_MAX
│   ├── composables/
│   │   ├── useEvents.ts              # Main event tracking API
│   │   └── useSignalQueue.ts         # Client batch queue → /api/_signals/ingest (retry once, `client_dropped`)
│   ├── plugins/
│   │   ├── events.client.ts          # Core plugin (hook infra + dev-only `debug` console echo)
│   │   ├── errors.client.ts          # window.onerror / rejections / Vue / chunk / app errors → signals (deduped)
│   │   └── identity.client.ts        # Always-on ui.click / ui.section / ui.page emitter
│   ├── providers/
│   │   └── signal.ts                 # The only provider: events → signal queue
│   ├── components/
│   │   └── DevEvents.vue             # Dev tools modal for manual testing
│   └── utils/
│       ├── identity.ts               # Content-free click/section resolvers + emit throttles
│       ├── locations.ts              # Event metadata and categorization
│       └── signal.ts                 # EventPayload → SignalRow, page/utm/review context, `data.error`
└── server/
    ├── handlers/
    │   ├── webhook.post.ts           # POST /api/v1/webhook (form capture)
    │   ├── signals-ingest.post.ts    # POST /api/_signals/ingest (client rows; ts clamp, 400/413 refusals)
    │   └── signals-export.get.ts     # GET  /api/_signals/export (cursor pull + epoch/meta)
    ├── middleware/
    │   └── page-request.ts           # Request id for every request; every document GET → `page_request` row
    ├── plugins/
    │   ├── signal-errors.ts          # Nitro error hook: 5xx → server_error, 404 → http.not_found, refused POST → ingest_rejected
    │   ├── signal-storage.ts         # Mounts `signals` to fs when NUXT_SIGNAL_STORE_DIR is set
    │   └── site-booted.ts            # Startup report: one consola line + warnings + `site_booted` row
    └── utils/
        ├── boot-report.ts            # Pure builder: startup line, production warnings, `site_booted` row
        ├── page-request.ts           # Page-visit filter rules + fire-and-forget append + 404 noise filter;
        │                             #   request-id, ingest-rejection (limiter, zod issue codes) and ts-clamp helpers
        ├── signal-buffer.ts          # Capped, time-retained ring buffer (unstorage), epoch/snapshot, appendSignal
        ├── signal-env.ts             # Pure env:'local' precedence rule (dev default vs explicit override)
        ├── signal-export.ts          # Bearer auth check + query parsing + export body builder
        ├── visitor-class.ts          # UA → human/agent/bot + agent sub-class
        ├── visitor-device.ts         # UA → device/browser/os family (bowser)
        └── visitor-hash.ts           # Daily-salted visitor hash + salt rotation
```

## Key Architecture

### Hook-Based Tracking
```
useEvents.trackEvent() → nuxtApp.callHook('events:track', payload)
                    ↓
              signal.ts → useSignalQueue().enqueue() → POST /api/_signals/ingest
```

The hook stays because it decouples components from transport and gives DevEvents.vue a
read point. It is not a plugin system: `signal.ts` is the only listener, plus a
`console.info` echo in `events.client.ts` when `events.debug` is on — dev-only: the layer
turns it on under `nuxt dev` (`$development`) and nowhere else, so a production site never
echoes events to the visitor's console.

### Signal Flow (the important one)
Everything a site captures — analytics events AND error/warning logs — becomes one
`SignalRow` (`runtime/types/signal.ts`) in a capped server-side ring buffer. An external
consumer (Polaris) pulls it with a cursor.

```
client events  → signal provider ─┐
client errors  → errors.client ───┼→ POST /api/_signals/ingest ─┐
                                  │                             ├→ ring buffer (unstorage)
form submits   → webhook.post.ts ─┘                             │        ↓
server errors  → server/plugins/signal-errors.ts ───────────────┤   GET /api/_signals/export
MCP tool calls → server/middleware/mcp-request.ts ───────────────┤   ?since=<seq>&limit=<n≤2000>
boot report    → server/plugins/site-booted.ts ─────────────────┤   → { rows, cursor, site, epoch, meta }
page GETs      → server/middleware/page-request.ts ─────────────┘
```

`server/middleware/mcp-request.ts` and `server/utils/mcp-request.ts` live in the root layer
(`layer/server/`, alongside `layer/server/mcp/tools/` and `layer/server/utils/mcp-signal.ts`),
not inside this module — this module's own File Map above only covers `layer/modules/events/`.
So does `GET /api/_health` (`layer/server/api/_health.get.ts` + `utils/health.ts`), which
reads the buffer's identity through `readSignalIdentity()`.

- **Envelope:** `{ id, seq, ts, site, kind: 'event'|'log', name, severity?, visitor?, page?, referrer?, utm?, review?, data?, env? }`,
  where `visitor` is `{ hash?, class?, subclass?, device?, browser?, os? }` and `severity` is
  `'error' | 'warning' | 'info'`. `info` is server-emitted only (`site_booted`); ingest still rejects it.
  Rows from before the ev2.3 cutover carry `visitor.anonId` instead of `hash`.
- **Row ids are the server's.** `appendSignal()` always mints a fresh UUID `id`
  (`withServerRowId()`); a client-sent `id` is kept as `data.clientId`. The client's
  `trackEvent` id is an event-*type* key (`section_view_<id>`, `hero_view`), identical on every
  occurrence — as a row id it made Polaris, which dedupes pulled rows on `id`, silently drop
  every repeat (single-seq holes, shared ids in its stores). Never read `id` as an event key;
  use `data.clientId`.
- **Review binding:** `review` is its own top-level field, read from a `?polaris_review=<token>`
  query param by `pageContext()`. It is **never** merged into `utm` and **never** persisted —
  only rows emitted while that tagged URL is current carry it. That is the whole design: an
  external reviewer needs exactly one tagged row to bind the token to a `visitor.hash`, and
  persisting it would stamp every later row on every later page instead. The hash rotates at
  UTC midnight, so a binding is only good for the day it was made.
- **Visitor classification:** every ingest/append path stamps `visitor.class:
  'human' | 'agent' | 'bot'` server-side from the request's `User-Agent`
  (`server/utils/visitor-class.ts`) — a hand-rolled matcher, checked against
  `isbot` first but skipped since it can't separate AI agents from classic
  crawlers and isn't in this monorepo's lockfile. Its AI user-agent list is
  `layer/shared/ai-agents.ts`, shared with the robots.txt policy in
  `layer/modules/ai-robots.ts` so the two can't drift. Client-supplied `visitor.class`
  is always overwritten, never trusted. Left unset only when a path has no
  request context to read a UA from (e.g. the Nitro error hook on a crash with
  no event). Agentic vs human traffic split is a core KPI (VISION.md) — this is
  itself signal, not metadata.
- **Agent sub-class:** `visitor.subclass` splits agent traffic by *what the fetch
  is for*, from the same taxonomy file's purpose grouping
  (`AI_AGENT_PURPOSE_GROUPS`), so the robots.txt split and the analytics split
  are the same split by construction:

  | `subclass` | source list | meaning |
  | --- | --- | --- |
  | `search` | `AI_SEARCH_AGENTS` | answer-engine index crawlers — presence here is distribution |
  | `live-user-fetch` | `AI_USER_FETCHERS` | the `*-User` family; a human is waiting on this fetch right now |
  | `training` | `AI_TRAINING_CRAWLERS` | corpus crawls; no click, no citation back |
  | `automation` | `AI_AUTOMATION_AGENTS` | headless browsers / test runtimes; never in robots.txt |

  **`subclass` is strictly additive — `class` stays `'human' | 'agent' | 'bot'`.**
  Polaris already groups exported rows on `class`, so widening that enum would
  silently reclassify historical traffic; a consumer that ignores `subclass`
  keeps working unchanged. Set only for `class: 'agent'`, and only when a
  *published* token matched: an agent recognised solely by a loose vendor
  substring (`AI_VENDOR_HINTS`) carries no subclass, because the vendor doesn't
  say what the fetch was for. Published tokens are matched longest-first, so
  `Applebot-Extended` beats a shorter `Applebot` and `Ai2Bot-Dolma` beats
  `AI2Bot`. `describeVisitor()` returns `{ class, subclass? }`;
  `classifyVisitor()` remains the class-only shorthand.
- **Device / browser / OS:** `appendSignal()` stamps `visitor.device` (`'mobile' | 'tablet' |
  'desktop'`), `visitor.browser` and `visitor.os` from the request UA on every row that has a
  request (`server/utils/visitor-device.ts`). Family names only (`Chrome`, `iOS`), never
  versions — less fingerprinting surface, and no feature needs them. Parsed by `bowser` (MIT,
  bundled types, ~8 KB gzipped, server bundle only); `ua-parser-js` was rejected — v2 is AGPL,
  v1 ships no types. Crawlers, TVs and bare HTTP clients get none of the three:
  `visitor.class` already says what they are. Client-supplied values are dropped.
- **Local debugging against Polaris:** `env: 'local'` is stamped on every row by
  `appendSignal()` (`server/utils/signal-buffer.ts`) — the single choke point every
  capture path funnels through — whenever the server is running in dev mode
  (`import.meta.dev`). It exists so rows produced on a developer's machine and pulled
  into a local Polaris store stay **permanently** distinguishable from production
  traffic, even after Polaris has stored them verbatim; there is no way to tell them
  apart after the fact otherwise. Strictly additive — Polaris's contract is "absent
  when it does not apply", so the key is simply missing on a production row, not
  `env: 'production'` (zero migration, no schema change on the consumer side). A
  locally-**built** (non-dev) server can still opt in via `NUXT_PUBLIC_SIGNAL_ENV=local`,
  and setting it to `production` suppresses the stamp even under dev mode (escape
  hatch). Explicit config always wins over the dev-mode default — see
  `resolveSignalEnv()` (`server/utils/signal-env.ts`) for the precedence rule, unit-tested
  in isolation from Nitro.
- **Cursor:** `seq` is monotonic *within an epoch*. Consumers send back the last `cursor` they saw.
- **Epoch:** the buffer's lineage id (a UUID in `meta`). Minted once, when the storage has none,
  and persisted with `head`/`oldest` immediately — a read-only boot (health, export) must not
  change it on the next restart. `seq` restarts at 1 whenever the storage is empty, so a `seq`
  only means something together with its epoch: the **memory driver mints a new epoch every
  boot**, the `fs` driver keeps it across restarts. A consumer that sees `epoch` change must
  reset its cursor (comparing cursors alone cannot tell a restart from a quiet site) and
  should key rows on `(epoch, seq)`, never on `id`.
- **Buffer:** `useStorage('signals')` — memory by default; `server/plugins/signal-storage.ts`
  mounts it to the unstorage `fs` driver when `NUXT_SIGNAL_STORE_DIR` is set (a Railway
  Volume mount path), so a redeploy/restart doesn't lose unpulled rows. Capacity
  `events.signals.capacity`, default 170 000 rows; oldest evicted. Sized for the identity
  stream: ~60 rows per visit × ~200 sessions/day ≈ 12k rows/day, so the buffer covers the
  full 14-day retention window (below) with headroom, and a consumer can be down for the
  whole window without losing rows. Write path (`writeRow`, serialised so `seq` stays
  monotonic): `head` advances only once the row is stored, so a failed write no longer burns
  a `seq` and leaves a hole no consumer can fill; once the row is durable, a failing
  prune/`meta` write is logged (`foundry` consola tag), not thrown — the next append retries
  it. On load, the boot probe skips rows past a stale persisted `head` (a crash between a
  row write and its `meta` write) rather than re-issuing a `seq` a consumer may have pulled.
- **Retention:** rows older than 14 days (`DEFAULT_SIGNAL_RETENTION_MS`,
  `server/utils/signal-buffer.ts`) are pruned on append, independent of the capacity cap —
  a quiet site doesn't hold rows forever just because it's nowhere near full. Both eviction
  rules (capacity + retention) advance one `oldest` cursor, persisted in `meta` alongside
  `head` so it survives a restart too. Pruning only ever removes exact `row:<seq>` keys —
  never a blanket `storage.clear()` — since the `signals` mount also carries other keys
  (`meta`, and the visitor-hash salt from `product-validator-ev2.3`).
- **Capacity warning:** at ≥90% of capacity, `appendSignal()` appends one `quota_low`
  log Site Event (`kind: 'log', severity: 'warning', data: { used, capacity, ratio }`),
  edge-triggered so it fires once per crossing rather than on every append while full.
- **Auth:** export requires `Authorization: Bearer <NUXT_SIGNAL_EXPORT_TOKEN>`. Missing/wrong
  token → 401. Token not configured → 503 (never open by default).
- **Export response:** `{ rows, cursor, site, epoch, meta }`. `rows`/`cursor`/`site` are the
  original contract; `epoch` and `meta` are additive and ride along on every page. `meta`
  (token-gated — it carries traffic volume) is `{ driver: 'memory' | 'fs', rows, headSeq,
  oldestSeq: number | null, oldestTs: number | null, capacity, retentionDays,
  evictedSinceBoot }`. `evictedSinceBoot` counts rows dropped by capacity or retention in
  this process and resets on restart — it tells a quiet site from a lossy one without
  scanning rows. Built by `buildExportResponse()` (`server/utils/signal-export.ts`).
- **Health:** `GET /api/_health` is unauthenticated, so it carries lineage, never volume:
  `{ ok, service, version, siteId, timestamp, buildId: string | null, signals: { driver:
  'memory' | 'fs' | 'unknown', epoch: string | null } }`. `signals` is omitted when signal
  capture is disabled, and degrades to `{ driver: 'unknown', epoch: null }` if the buffer
  can't be read — a broken buffer never fails the endpoint. It does no per-request storage
  I/O: the epoch is memoised after the first `meta` read, which the boot plugin makes.
- **Boot report:** `server/plugins/site-booted.ts` (registered after `signal-storage` so the
  driver is settled) runs once per process start, fire-and-forget (a failed report is logged
  and dropped, never a failed boot; skipped during `nuxt generate` prerender). It logs one
  `foundry`-tagged consola line — `v<version> booted site=<id|UNSET> driver=<memory|fs(dir)>
  capacity retention exportToken=yes|no env epoch` — and, **only under
  `NODE_ENV=production`**, one warning each for: `NUXT_PUBLIC_SITE_ID` unset, the memory
  driver (every restart restarts `seq` and drops unpulled rows), and no export token (export
  answers 503). It also appends `{ kind: 'log', severity: 'info', name: 'site_booted', data: {
  version, buildId, driver, epoch, siteIdSet, exportTokenSet } }` — the in-stream marker a
  consumer can find a restart boundary by. Pure builder: `server/utils/boot-report.ts`.
- **MCP tool calls:** every `tools/call` JSON-RPC request reaching `/mcp` (or a
  named `/mcp/<handler>` route) is parsed once by Nitro middleware
  (`layer/server/middleware/mcp-request.ts` + pure JSON-RPC extraction in
  `layer/server/utils/mcp-request.ts`), which appends via `captureMcpToolCall()`
  (`layer/server/utils/mcp-signal.ts`) →
  `{ kind: 'event', name: 'mcp_tool_called', visitor: { class: 'agent' },
  data: { tool, args, userAgent, requestId } }`. `visitor.class` is stamped `agent` from the
  transport, not the UA — MCP is agent-only, and MCP clients send inconsistent
  User-Agents that `classifyVisitor()` would read as `bot`. Fire-and-forget: a
  failed append never surfaces to the agent. The middleware reads the raw POST
  body *before* `defineMcpTool`'s `cache` option (`@nuxtjs/mcp-toolkit`, which
  wraps a tool's `handler` in Nitro's `defineCachedFunction` outside the tool
  code) can serve a cached response, so a repeat call inside a tool's cache
  window is counted exactly like a cache miss — this used to be the gap here.
  Tool handlers under `layer/server/mcp/tools/` no longer call
  `captureMcpToolCall()` themselves, so a cache *miss* isn't double-counted
  either: the middleware is the only call site.

### Ingest and the client queue
**Ingest** (`server/handlers/signals-ingest.post.ts`) is size-capped (100 rows / 128 KB),
zod-validated and appends row by row. Refusals `throw createError` and never append (see
"Logging"):

- Body isn't JSON → **400** (`body:invalid_json`), never a 500. Fails the schema → 400 with
  zod `path:code` issues. Over 128 KB → 413 (`body:too_large`; the check counts characters,
  not bytes).
- `ts` outside `[now − 24h, now + 5min]`, missing or not a number → replaced with the server
  clock (`clampClientTs()`). The retention prune walks rows assuming roughly chronological
  `ts`; one forged or far-off client clock would wedge it.
- `page` / `referrer` over `SIGNAL_TEXT_MAX` (512, `runtime/types/signal.ts`) fail the whole
  batch with a 400. The client truncates to the same constant in `pageContext()`, so one
  long referrer can never reject a batch — keep the two on the one number.
- `visitor.class`/`subclass`/`hash`/… and the client `id` are never trusted (see "Row ids are the server's").
- `severity` accepts `error` | `warning` only; `info` is server-emitted.

The webhook (`/api/v1/webhook`) follows the same rule: a missing or non-object body is a 400
via schema validation, no longer a destructuring 500.

**Client queue** (`runtime/composables/useSignalQueue.ts`) is best-effort but never silent.
It debounces POSTs (~800 ms, 4 s max wait), sends at most 50 rows per request, and holds at
most 200 buffered rows (oldest dropped first). `flush()` never rejects. On `pagehide` it
sends everything as back-to-back `sendBeacon` chunks of 50.

- Failed flush on a **network error or 5xx**: the rows are requeued once, in original order,
  and go out on the next natural flush trigger (no timer of its own). A second failure drops
  them.
- Failed flush on a **4xx**: dropped at once — retrying a refused batch cannot help.
- Every drop is counted by reason (`rejected` | `retry_exhausted` | `overflow`) and reported
  as one `client_dropped` row per non-zero reason (`kind: 'log', severity: 'warning', data: {
  count, reason }`), prepended to the next flush. If that request fails too, the counts are
  handed back, not lost.

**Client error rows** (`runtime/plugins/errors.client.ts`, `kind: 'log', severity: 'error'`,
`data: { message ≤500, stack ≤1000 }`): `vue_error` (Vue `errorHandler`), `window_error`,
`unhandled_rejection`, `chunk_error` (`app:chunkError` — a stale tab asking for a chunk the
last deploy deleted; the page is about to reload, so this is the only trace), and `app_error`
(`app:error`). All are deduped on `(name, message)` for 10 s so a render error looping every
frame can't flood the queue; the dedupe map is bounded at 50 entries.

**`form_error`** rows carry `data.error` — the error's message only (a string, or an object's
`.message`), capped at 200 chars. Never a stringified object, so field values can't leak in.

### Server-Side Page Visits (`page_request`)
`server/middleware/page-request.ts` (rules + append in `server/utils/page-request.ts`)
appends one row per document GET **before any Vue code runs**, so visitors that never
execute JavaScript still leave signal. GPTBot, ClaudeBot and PerplexityBot do a plain GET,
parse the HTML and leave — without this they were invisible, and the every-visit-is-signal
claim was false for exactly the traffic the agentic-vs-human KPI is about.

```
{ kind: 'event', name: 'page_request', page, referrer?,
  visitor: { class, subclass? }, data: { userAgent, format: 'html' | 'markdown', requestId } }
```

`data.format` (product-validator-m0f.15) distinguishes the served representation —
`'markdown'` for a `.md`-suffixed content route, an `Accept: text/markdown` negotiated
fetch, or `/llms.txt` / `/llms-full.txt`; `'html'` for everything else. Additive field on
the existing free-form `data` bag, no envelope/schema change: it exists so a consumer can
compute the agent-native-document share of `page_request` without inferring format back out
of `page` (a bare `.md` suffix is visible there, but negotiated and `llms*.txt` requests
aren't). It never affects `isPageRequest()`'s admit/reject decision — computed separately by
`pageRequestFormat()` only after a candidate has already passed the filter.

**Double-count policy — `page_request` and `ui.page` are different facts. Do not sum them.**

| | `page_request` (server) | `ui.page` (client) |
| --- | --- | --- |
| fires on | every document GET reaching the server | every route the client rendered |
| SPA route change | no (no request is made) | yes |
| no-JS visitor | yes | never |
| use it for | documents served; the agent/bot traffic split | pages a real browser rendered |

A JS-capable human doing a hard navigation legitimately produces one of each. That is two
facts, not one fact double-counted, and the distinct `name` is what lets a consumer choose:
`ui.page` for browser page-views, `page_request` filtered on `visitor.class` /
`visitor.subclass` for agent traffic. The alternative — emitting `page_request` only for
non-humans — was rejected: it would make a no-JS *human* invisible, which is the same bug
one class over.

**Filtering** (all in `isPageRequest()`, pure and unit-tested). A request is a page visit
only if it is a `GET`, is not the prerenderer crawling us during `nuxi generate`
(`import.meta.prerender` / `x-nitro-prerender`), is not under `/api/`, `/_nuxt/`, `/_ipx/`,
`/_scripts/`, `/_signals/`, `/_health`, `/_vercel/`, `/.well-known/`, `/@vite/`, `/@id/`,
`/@fs/`, `/node_modules/`, `/__nuxt*`, has no non-`.html`/`.md` file extension (favicon.ico,
robots.txt, sitemap.xml, *.js, *.css, *.png all drop out — except `/llms.txt` and
`/llms-full.txt`, admitted by an exact-path allowlist since `.txt` otherwise stays an asset
extension), and looks like a document fetch: `Sec-Fetch-Dest` decides when present
(`document`/`iframe` only, so browser `$fetch` and prefetches drop), otherwise an `Accept`
header that names a type must name an HTML- or markdown-ish one (`text/html`,
`application/xhtml`, `text/markdown`) — a wildcard or missing `Accept` passes, because that
is what a bare crawler GET looks like. `.md` suffixes, `Accept: text/markdown` negotiation
and the two `llms*.txt` documents are agent-native surfaces `markdown-rewrite` and
`nuxt-llms` serve (product-validator-m0f.15) — real document GETs, not assets, even though
none of them are HTML.

Fire-and-forget like `captureMcpToolCall()`: the middleware returns nothing, awaits nothing,
and swallows every failure. A dropped row costs a data point; a thrown one costs the page.

### 404s (`http.not_found`)
`server/plugins/signal-errors.ts` special-cases a thrown `statusCode: 404` (the catch-all
page, `layer/app/pages/[...slug].vue`, is the only surface that throws one): instead of a
`server_error` log row, it appends `{ kind: 'event', name: 'http.not_found', page,
referrer?, visitor, data: { requestId } }` — product-validator-ev2.6. A 404 isn't a crash,
so it gets its own Site Event rather than inflating the error-log stream; the point is
catching a campaign link that silently lands on a missing page, which `server_error`
alerting isn't shaped for.

`isNotableNotFound()` (`server/utils/page-request.ts`) decides whether a 404 is worth the
row: it reuses `isPageRequest()`'s asset/internal-route filtering (`/_nuxt/`, `favicon.ico`,
`/api/*`, …), then additionally drops `visitor.class: 'bot'` traffic and a short list of
vulnerability-scanner probe paths (`/wp-admin`, `/wp-login.php`, `/.env`, `/.git`,
`/phpmyadmin`, `/administrator`, `/cgi-bin`, …) that 404 on every public server by
construction and say nothing about a broken link. Matching is prefix-on-a-path-boundary
(`/wp-admin` or `/wp-admin/…`, never a bare substring), so a legitimate page like
`/wp-admin-consulting` isn't mistaken for a probe.

### Identity Events (always on, content-free)
`runtime/plugins/identity.client.ts` emits a behaviour stream for **every** visitor through the
normal `events:track` pipeline, so each row already carries `page`, `ts`, `visitor` and `review`:

| name | `data` |
| --- | --- |
| `ui.click` | `{ target, label?, section? }` |
| `ui.section` | `{ section, visible }` |
| `ui.page` | `{ from? }` — route change, and the first load |
| `ui.outbound` | `{ host, kind: 'outbound' \| 'download', ext? }` |

**Content-free is a hard rule:** no pixel coordinates, no input values, no keystrokes. `target`
is built from authored attributes only (`data-signal-target` → `tag#id` → `tag[data-testid]` →
`tag`), and `label` (aria-label, else collapsed text, 80 chars max) is never read off a form
field. Add `data-signal-ignore` to an element or ancestor to exclude a subtree.

**Section identity convention.** A section is any element matching `[data-section]` or
`section[id]`; its stable id is `data-section` when present, else the element's `id`.
`SectionWrapper` stamps `data-section` from its `sectionId` prop, so layer-built pages are
covered for free; a hand-rolled section on a consuming site opts in with `data-section="pricing"`
or a plain `<section id="pricing">`.

**Volume control.** Clicks dedupe on `target|section` within 400 ms. Sections report settled
*transitions* only — a state must hold for 400 ms before it emits — so scrolling straight past
ten sections emits nothing rather than twenty rows, and an on-screen section never re-emits.

**No client-side bot filtering, on purpose:** `visitor.class` is stamped server-side from the
request UA at ingest and consumers filter on it. A second, weaker client verdict would only be
overwritten. Emission is also fully guarded — a dropped row costs a data point, a thrown one
costs the visit.

**`ui.outbound`** (product-validator-ev2.5) fires on a click that either targets a different
host than the current page (`kind: 'outbound'`) or names a document/archive/installer
extension — `pdf`, `zip`, `csv`, `xlsx`, `pptx`, `docx`, `dmg`, and siblings
(`DOWNLOAD_EXTENSIONS`, `runtime/utils/identity.ts`) — or carries the `download` attribute
(`kind: 'download'`). `data.host` is the target's hostname only — never the full URL, path
or query string. `mailto:`/`tel:`/non-`http(s)` links have no meaningful host and are
skipped. It goes through the same `emit()` → `trackEvent` → hook → queue pipe as
`ui.click`/`ui.section`/`ui.page`, so it's fire-and-forget by construction and never blocks
the navigation or download the click triggers; the existing `sendBeacon` flush on `pagehide`
(`useSignalQueue.ts`) is what gets a same-tab outbound navigation's row out before the page
unloads, and a `target="_blank"` link or a download that never navigates just rides the
normal debounced flush since the page stays open.

### Form Submission Flow
`useFormCapture()` validates client-side, then POSTs straight to `/api/v1/webhook` →
inline honeypot/timing check → zod payload validation (a failure throws a 400, which the
error hook records as `ingest_rejected`) → `appendSignal({ kind: 'event', name: 'form_submitted' })`. The server is the durable
capture point (it also stamps `visitor.class`); a `$fetch` failure surfaces a toast and a
`form_error` event. There is no outbound forward to a third-party webhook — Polaris pulls
the buffer instead.

Route name is historical: `/api/v1/webhook` is the form-capture endpoint, not a webhook
sender. It's kept stable so existing deployments don't break.

### Request correlation
`server/middleware/page-request.ts` calls `ensureRequestId(event)` on **every** request
(`/api`, `/mcp` and static included), before any filtering. The id is an inbound
`x-request-id` only if it matches `/^[\w.-]{8,64}$/` (so a caller can't inject header
content or stuff arbitrary text into the buffer); otherwise a fresh `randomUUID()`. It lives
on `event.context.foundryRequestId`, is echoed as the `x-request-id` response header, and
lands in `data.requestId` on `page_request`, `server_error`, `http.not_found`,
`ingest_rejected`, `form_submitted` and `mcp_tool_called` — the rows one request produced
share it. `ensureRequestId()` is idempotent and total (whichever caller runs first wins; the
header write is skipped once headers are flushed — the Nitro error hook runs late — and can't
throw), so any server code that appends a row for a request should call it rather than
mint its own. Client-ingested rows carry no `requestId`.

### Logging
There is no logging library for signals. Server handlers `throw createError({ statusCode,
statusMessage })` (h3 native) and the Nitro error hook (`server/plugins/signal-errors.ts`)
turns thrown request errors into rows. **Do not** `appendSignal` an error in a handler
*and* throw it — that double-records. The hook is the **single writer** for the three
rows below; handlers only throw:

| thrown status | row | notes |
| --- | --- | --- |
| `< 500`, **404** | `http.not_found` (event) | filtered by `isNotableNotFound()` — see "404s" |
| `< 500`, **400 / 413 / 415** on `POST /api/_signals/ingest` or `/api/v1/webhook` | `ingest_rejected` (log, `warning`) | rate-limited, see below |
| `< 500`, anything else | **none** | a client error is the caller's problem, not a crash |
| `>= 500`, or no status | `server_error` (log, `error`) | the only crash row |

**4xx never becomes `server_error`.** An unauthenticated probe of `/api/_signals/export`
(401) used to land ~288 `server_error` rows per site per day (product-validator-g58); an
alerting consumer on `server_error` should only ever see real crashes. A `server_error` row
is `page` (the raw `event.path`, query string included), `data: { message ≤300, stack ≤1000,
statusCode, requestId, method, path (query stripped), status }` — the last four only when
there is a request. A crash with no `event` has no `visitor`, `requestId` or `path`.

**`ingest_rejected`** (`kind: 'log', severity: 'warning'`, `data: { requestId, path, status,
issues }`) means a tracker is silently losing rows. `issues` are zod `path:code` strings
(max 10, ≤100 chars each) — **never field values**; non-zod refusals use `body:invalid_json`
and `body:too_large`. Handlers put them on `createError({ data: { issues } })`
(`zodIssueCodes()`); the hook re-validates them (`readRejectionIssues()`) before they reach a
row. Rate limit: one row per `(path, status)` per 60 s per process, so a client retrying in a
loop leaves one row a minute, not thousands.

Operator-facing console output is the single `consola` logger tagged `foundry`
(`consola.withTag('foundry')`): the boot line and warnings, and buffer housekeeping/epoch
persistence failures. It never carries visitor data and never replaces a signal row.

### Row Catalogue
Every `name` the layer emits. `Stamped by`: where the row is written. Severity is absent on
events.

| name | kind | severity | stamped by |
| --- | --- | --- | --- |
| `page_request` | event | — | `server/middleware/page-request.ts` |
| `http.not_found` | event | — | `signal-errors.ts` (thrown 404) |
| `form_submitted` | event | — | `webhook.post.ts` |
| `mcp_tool_called` | event | — | `layer/server/middleware/mcp-request.ts` |
| `ui.click` `ui.section` `ui.page` `ui.outbound` | event | — | `identity.client.ts` |
| `section_view` `offer_click` | event | — | layer components via `trackEvent` |
| `form_error` | event | — | `useFormCapture` via `trackEvent` (`data.error`) |
| `server_error` | log | error | `signal-errors.ts` (5xx / no status) |
| `ingest_rejected` | log | warning | `signal-errors.ts` (refused capture POST) |
| `quota_low` | log | warning | `appendSignal()` (≥90% capacity) |
| `site_booted` | log | info | `site-booted.ts` |
| `client_dropped` | log | warning | `useSignalQueue.ts` |
| `vue_error` `window_error` `unhandled_rejection` `chunk_error` `app_error` | log | error | `errors.client.ts` |

A consuming site may emit more through `trackEvent`; this is only what the layer itself
writes. Adding a name here means adding it to this table.

**Known gaps:** `server_error.page` keeps the query string (`data.path` doesn't); the 413
check counts characters, not bytes.

### Anti-Spam Layers
Honeypot filled in, or `timeOnForm` under 2s → treated as a bot and silently accepted
(no error surfaced, so bots don't learn they were caught). Checked inline in
`webhook.post.ts` — no dedicated util or rate limiter.

### Anonymous Identity (cookieless)
`visitor.hash` = `sha256(daily_salt + site + ip + user_agent)`, truncated to 16 hex chars,
stamped by `appendSignal()` on every row that has a request (`server/utils/visitor-hash.ts`,
decision product-validator-ev2.1). Nothing is stored on the device, so no consent is needed
under ePrivacy Art. 5(3). The client sends no identity at all; a client-supplied hash is
dropped, and the ingest schema strips a stale client's `anonId`.

- **IP:** `getRequestIP(event, { xForwardedFor: true })` — Railway's proxy terminates the
  connection. The raw IP is only a digest input; it is never stored.
- **Salt:** random, one key (`visitor-salt`) in the `signals` storage, replaced on the first
  append of each UTC day. Overwriting the key is the deletion of the old salt, so past
  hashes can't be recomputed. On the memory driver a restart mints a new salt, splitting a
  day's visitors at the restart; a persistent `signals` mount avoids that.
- **Trade:** one value per visitor per day. Same-day features (uniques, sessions, bounce,
  funnels, review binding) work; cross-day returning-visitor recognition is gone on purpose.
- **Legacy:** older builds stored `foundry_userId` in localStorage; `events.client.ts` removes
  it on boot. `useUserIdentity()` no longer exists.

## How to Modify

### Add new event type
1. Add to `TrackedEvents` union in `runtime/types/events.ts`
2. Add metadata in `runtime/utils/locations.ts`
3. Use in component: `trackEvent({ id: 'x', type: 'new_type', location: 'hero' })`

### Emit a signal from server code
```ts
import { appendSignal } from '../utils/signal-buffer'

await appendSignal({ kind: 'log', severity: 'warning', name: 'quota_low', data: { … } }, event)
```
`site`, `id`, `ts`, and `seq` are filled in for you.

## Module Options (`events:` in nuxt.config)

```ts
events: {
  signals: { enabled: true, capacity: 170_000, captureErrors: true },
  debug: false,  // console.info every tracked event (client) — default false
}
```

`debug` is dev-only by design: the layer's `$development` block sets it `true` under
`nuxt dev` and nowhere else, so a live site stays quiet. (`runtimeConfig.public.debug` is set
the same way, but nothing reads it.) Don't set `debug: true` in a consumer's base config —
it echoes every event, including the identity stream, to every visitor's console.

That's the whole surface. There is no `providers` and no `webhook` option.

## Environment Variables

- `NUXT_SIGNAL_EXPORT_TOKEN` — Bearer token for `GET /api/_signals/export` (unset → 503)
- `NUXT_PUBLIC_SITE_ID` — Site identifier stamped on every row (defaults to request host;
  unset in production → boot warning)
- `NUXT_PUBLIC_SIGNAL_ENV` — Overrides the `env:'local'` debug marker's dev-mode default;
  `local` stamps it even on a non-dev server, `production` suppresses it even under
  `import.meta.dev`. See "Local debugging against Polaris" above.
- `NUXT_SIGNAL_STORE_DIR` — Absolute directory to persist the `signals` ring buffer to
  (`server/plugins/signal-storage.ts`), e.g. a Railway Volume's mount path. Unset → the
  in-memory driver (default; fine for dev/tests, loses unpulled rows and mints a new epoch
  on restart; unset in production → boot warning). Read from
  `process.env` at Nitro startup, not baked into `nitro.storage` at build time, since a host
  like Railway injects its runtime env into the running container independently of the build.

Nothing else. If you're adding a fifth env var to this module, you're probably adding a
feature that doesn't capture signal.

## Design Principles

1. No database — the buffer is a transient ring consumers pull from, not storage
2. No auth — a server-side daily visitor hash is sufficient for signal capture
3. No analytics vendors — one pipe out, the consumer decides what to do with it
4. No second destination — adding a fan-out target means two sources of truth
