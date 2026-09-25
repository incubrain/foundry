# Events Module — AI Agent Instructions

Signal capture. One pipe: client event → `events:track` hook → signal provider →
`/api/_signals/ingest` → capped ring buffer → external consumer pulls
`/api/_signals/export`. There are no analytics providers, no outbound webhooks, and no
logging library — anything that isn't the signal pipe was removed on purpose.

## File Map

```
layer/modules/events/
├── index.ts                          # Module setup (auto-imports, routes, plugins)
├── runtime/
│   ├── types/
│   │   ├── events.ts                 # Event types, interfaces, module options
│   │   └── signal.ts                 # SignalRow envelope (events AND logs)
│   ├── composables/
│   │   ├── useEvents.ts              # Main event tracking API
│   │   └── useSignalQueue.ts         # Client batch queue → /api/_signals/ingest
│   ├── plugins/
│   │   ├── events.client.ts          # Core plugin (hook infra + `debug` console echo)
│   │   ├── errors.client.ts          # window.onerror / rejections / Vue errors → signals
│   │   └── identity.client.ts        # Always-on ui.click / ui.section / ui.page emitter
│   ├── providers/
│   │   └── signal.ts                 # The only provider: events → signal queue
│   ├── components/
│   │   └── DevEvents.vue             # Dev tools modal for manual testing
│   └── utils/
│       ├── identity.ts               # Content-free click/section resolvers + emit throttles
│       ├── locations.ts              # Event metadata and categorization
│       └── signal.ts                 # EventPayload → SignalRow, page/utm/review context
└── server/
    ├── handlers/
    │   ├── webhook.post.ts           # POST /api/v1/webhook (form capture)
    │   ├── signals-ingest.post.ts    # POST /api/_signals/ingest (client rows)
    │   └── signals-export.get.ts     # GET  /api/_signals/export (cursor pull)
    ├── middleware/
    │   └── page-request.ts           # Every document GET → `page_request` row (non-JS visitors)
    ├── plugins/
    │   └── signal-errors.ts          # Nitro request errors → signal buffer
    └── utils/
        ├── page-request.ts           # Page-visit filter rules + fire-and-forget append
        ├── signal-buffer.ts          # Capped ring buffer (unstorage) + appendSignal
        ├── signal-env.ts             # Pure env:'local' precedence rule (dev default vs explicit override)
        ├── signal-export.ts          # Bearer auth check + query parsing
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
`console.info` echo in `events.client.ts` when `events.debug` is on.

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
page GETs      → server/middleware/page-request.ts ─────────────┘   → { rows, cursor, site }
```

`server/middleware/mcp-request.ts` and `server/utils/mcp-request.ts` live in the root layer
(`layer/server/`, alongside `layer/server/mcp/tools/` and `layer/server/utils/mcp-signal.ts`),
not inside this module — this module's own File Map above only covers `layer/modules/events/`.

- **Envelope:** `{ id, seq, ts, site, kind: 'event'|'log', name, severity?, visitor?, page?, referrer?, utm?, review?, data?, env? }`,
  where `visitor` is `{ hash?, class?, subclass?, device?, browser?, os? }`. Rows from before the ev2.3 cutover
  carry `visitor.anonId` instead of `hash`.
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
- **Cursor:** `seq` is monotonic. Consumers send back the last `cursor` they saw.
- **Buffer:** `useStorage('signals')` (memory by default — mount fs/KV in `nitro.storage`
  to survive restarts). Capacity `events.signals.capacity`, default 100 000 rows; oldest evicted.
  Sized for the identity stream: ~60 rows per visit × ~200 sessions/day ≈ 12k rows/day, so the
  buffer holds ~8 days and a consumer can be down for a week without losing rows.
- **Auth:** export requires `Authorization: Bearer <NUXT_SIGNAL_EXPORT_TOKEN>`. Missing/wrong
  token → 401. Token not configured → 503 (never open by default).
- **Client batching:** `useSignalQueue()` debounces POSTs (~800 ms, max 50 rows) and flushes
  with `navigator.sendBeacon` on pagehide. The ingest handler caps a request at 100 rows / 128 KB.
- **MCP tool calls:** every `tools/call` JSON-RPC request reaching `/mcp` (or a
  named `/mcp/<handler>` route) is parsed once by Nitro middleware
  (`layer/server/middleware/mcp-request.ts` + pure JSON-RPC extraction in
  `layer/server/utils/mcp-request.ts`), which appends via `captureMcpToolCall()`
  (`layer/server/utils/mcp-signal.ts`) →
  `{ kind: 'event', name: 'mcp_tool_called', visitor: { class: 'agent' },
  data: { tool, args, userAgent } }`. `visitor.class` is stamped `agent` from the
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

### Server-Side Page Visits (`page_request`)
`server/middleware/page-request.ts` (rules + append in `server/utils/page-request.ts`)
appends one row per document GET **before any Vue code runs**, so visitors that never
execute JavaScript still leave signal. GPTBot, ClaudeBot and PerplexityBot do a plain GET,
parse the HTML and leave — without this they were invisible, and the every-visit-is-signal
claim was false for exactly the traffic the agentic-vs-human KPI is about.

```
{ kind: 'event', name: 'page_request', page, referrer?,
  visitor: { class, subclass? }, data: { userAgent, format: 'html' | 'markdown' } }
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

### Identity Events (always on, content-free)
`runtime/plugins/identity.client.ts` emits a behaviour stream for **every** visitor through the
normal `events:track` pipeline, so each row already carries `page`, `ts`, `visitor` and `review`:

| name | `data` |
| --- | --- |
| `ui.click` | `{ target, label?, section? }` |
| `ui.section` | `{ section, visible }` |
| `ui.page` | `{ from? }` — route change, and the first load |

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

### Form Submission Flow
`useFormCapture()` validates client-side, then POSTs straight to `/api/v1/webhook` →
inline honeypot/timing check → zod payload validation →
`appendSignal({ kind: 'event', name: 'form_submitted' })`. The server is the durable
capture point (it also stamps `visitor.class`); a `$fetch` failure surfaces a toast and a
`form_error` event. There is no outbound forward to a third-party webhook — Polaris pulls
the buffer instead.

Route name is historical: `/api/v1/webhook` is the form-capture endpoint, not a webhook
sender. It's kept stable so existing deployments don't break.

### Logging
There is no logging library. Server handlers `throw createError({ statusCode,
statusMessage })` (h3 native) and the Nitro error hook (`server/plugins/signal-errors.ts`)
turns thrown request errors into `kind: 'log'` rows. **Do not** `appendSignal` an error in
a handler *and* throw it — that double-records. Pure info logging is gone.

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
  signals: { enabled: true, capacity: 100_000, captureErrors: true },
  debug: true,   // console.info every tracked event (client)
}
```

That's the whole surface. There is no `providers` and no `webhook` option.

## Environment Variables

- `NUXT_SIGNAL_EXPORT_TOKEN` — Bearer token for `GET /api/_signals/export` (unset → 503)
- `NUXT_PUBLIC_SITE_ID` — Site identifier stamped on every row (defaults to request host)
- `NUXT_PUBLIC_SIGNAL_ENV` — Overrides the `env:'local'` debug marker's dev-mode default;
  `local` stamps it even on a non-dev server, `production` suppresses it even under
  `import.meta.dev`. See "Local debugging against Polaris" above.

Nothing else. If you're adding a fourth env var to this module, you're probably adding a
feature that doesn't capture signal.

## Design Principles

1. No database — the buffer is a transient ring consumers pull from, not storage
2. No auth — a server-side daily visitor hash is sufficient for signal capture
3. No analytics vendors — one pipe out, the consumer decides what to do with it
4. No second destination — adding a fan-out target means two sources of truth
