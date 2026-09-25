# Agent-traffic share report — decision + spec

Bead: `product-validator-m0f.12`. Status: design ratified, zero Foundry-side code planned;
the one capture-side gap in §3 is fixed (`product-validator-m0f.15`).

> Code cited here lives on `main` (`68b4f4e`). This branch is 10 commits behind it — the
> `page_request` capture is on local `main` only, not yet on `origin/main`.

## 1. Decision

**The agent-traffic report lives entirely in Polaris, computed from exported `SignalRow`s;
Foundry ships no aggregation, no endpoint and no UI for it.**

`VISION.md` § Purpose: "Foundry ends at the stream. No charts, no dashboards, no anomaly
detection inside the site — the consumer owns interpretation." § Boundaries names
"in-product analytics dashboards" as permanently out. The KPI it serves —
*Agent-traffic visibility*, "the agent share is a number we can quote per site" — is a
statement about what the **consumer** can answer, not about where the arithmetic runs. Every
input below is already a field on the exported row, so a Foundry-side report would duplicate
Polaris logic behind a boundary that exists to keep it out.

## 2. Metric definitions

**Row taxonomy.** Three families, three different questions. They are never summed.

| row `name` | emitted by | one row per |
| --- | --- | --- |
| `page_request` | `server/middleware/page-request.ts` | document GET reaching Nitro, every class |
| `ui.page` | `runtime/plugins/identity.client.ts` | route a JS client actually rendered |
| `mcp_tool_called` | `layer/server/utils/mcp-signal.ts` | uncached MCP tool invocation |

**Dedupe rule: there is none — pick one name per metric, never merge.** A JS-capable human
doing a hard navigation legitimately emits one `page_request` **and** one `ui.page`; per
`server/utils/page-request.ts` that is "two facts, not one fact counted twice". `ui.page`
never exists for a non-JS visitor and `page_request` never fires on an SPA route change, so
no row is ever a duplicate of another. `ui.click` / `ui.section` are behavioural depth, not
traffic — they are outside every metric here.

**Universe** for metrics 1, 2 and 5: rows where `name === 'page_request'`, scoped by `site`
and by `ts` window. Nothing else enters the denominator.

| # | metric | definition |
| --- | --- | --- |
| 1 | **Agent share of documents served** | `count(visitor.class === 'agent') / count(all page_request)`. The headline KPI number. |
| 2 | **Agent purpose mix** | agent `page_request` rows grouped by `visitor.subclass` → `search`, `live-user-fetch`, `training`, `automation`, plus an explicit **`unattributed`** bucket for agent rows with no `subclass`. Shares of the agent subset, not of all traffic. |
| 3 | **Class mix** | the same denominator split three ways: `human` / `agent` / `bot`. Metric 1 is one slice of it; keep `bot` visible so a crawler surge is not read as agent growth. |
| 4 | **Agent intent depth** | `count(mcp_tool_called)` and its ratio to agent `page_request` in the same window. Its own denominator — MCP calls are not document fetches and must never be added to metric 1. Group by `data.tool`. |
| 5 | **Unclassified rate** | `count(page_request where visitor?.class is undefined) / count(all page_request)`. `VISION.md` names "unclassified traffic trending up" as the KPI's failure mode; this is the watch. |

**Subclass roll-up.** `subclass` is additive to `class` and set only when `class === 'agent'`
and the UA matched a *published* token (`runtime/types/signal.ts`; `AI_AGENT_PURPOSE_GROUPS`
in `layer/shared/ai-agents.ts`). An agent recognised only by a loose vendor substring
(`AI_VENDOR_HINTS`) carries no subclass by design. Polaris must therefore treat missing
`subclass` on an agent row as `unattributed` — never as zero agent traffic, and never
back-fill it from the vendor.

## 3. Data contract

Everything metrics 1–5 need is already on the wire from
`GET /api/_signals/export?since=<seq>&limit=<n≤2000>` (`SignalExportResponse`): `seq`
(cursor), `ts`, `site`, `name`, `visitor.class`, `visitor.subclass`, `page`, `data.tool`.
**No new envelope field is required.**

> **Fixed (`product-validator-m0f.15`) — agent-native surfaces now emit a `page_request`
> row.** `isPageRequest()` (`layer/modules/events/server/utils/page-request.ts`) used to
> reject any path whose extension wasn't `.html` (`ASSET_EXTENSION`), and any request whose
> `Accept` named a type but no HTML-ish one. Both shapes the `markdown-rewrite` module
> serves were dropped as a result: `/blog/post.md` (suffix mode) failed the extension test,
> and `/blog/post` with `Accept: text/markdown` failed the Accept test unless the client
> also sent `*/*`. `/llms.txt` and `/llms-full.txt` were dropped too. `isPageRequest()` now
> admits a `.md` suffix, `Accept: text/markdown`, and the two `llms*.txt` paths (an
> exact-path allowlist, since `.txt` stays an asset extension everywhere else) — real assets
> (js/css/images/fonts/etc.), API routes and internal routes are still rejected exactly as
> before. The emitted row also carries `data.format: 'markdown' | 'html'` so metrics 1–3 can
> report the agent-native-document share without inferring format from `page`; see
> `layer/modules/events/AGENTS.md`'s `page_request` table for the row shape.
>
> The docblock in `layer/modules/markdown-rewrite/server/middleware/raw-markdown.ts` claimed
> page-request capture "runs first and still sees `.md` traffic" before this fix landed —
> the ordering was always correct, but the filter defeated the claim. It now matches
> reality and has been reworded accordingly.

## 4. Known blind spots

Each verified against the code, not assumed.

- **Memory buffer by default.** `createSignalBuffer` runs over `useStorage('signals')`,
  "memory by default — mount fs/KV in `nitro.storage`" (`server/utils/signal-buffer.ts`). A
  restart or a new serverless instance loses every unpulled row. Any deployment that wants a
  trustworthy denominator must mount durable storage.
- **Silent ring eviction.** Capacity defaults to 100 000 rows, oldest evicted on append.
  `read()` clamps its start to `oldestSeq(head)`, so a consumer that falls too far behind
  gets a window with no error. Polaris *can* detect it — the first returned row's `seq`
  exceeds `since + 1` — but there is no explicit gap flag, so it must check.
- **Cached MCP calls undercount metric 4.** `get-page` and `list-pages` declare `cache: '1h'`,
  `what-changed` declares `cache: '5m'`; `captureMcpToolCall()` is only reached on a cache
  miss, so repeat identical calls inside the window leave no row. (A parallel fix was
  mentioned when this bead was written; nothing on `main` in this worktree reflects one yet,
  so treat metric 4 as a floor.)
- **Prerendered / CDN-served pages produce nothing.** The middleware is Nitro-side: a fully
  static route served from a CDN never reaches it. The prerender crawl itself is excluded on
  purpose (`import.meta.prerender` / `x-nitro-prerender`).
- **Identity on `page_request` is daily only.** Since product-validator-ev2.3,
  `appendSignal()` stamps a cookieless `visitor.hash` on every row with a request, so
  same-day uniques are derivable; the hash rotates at UTC midnight, so cross-day uniques
  are not. Metrics here remain **row counts** unless stated otherwise.
- **No page attribution on `mcp_tool_called`.** No `page` field; `visitor.class` is hardcoded
  `'agent'` from the transport rather than the UA. Tool + args are all there is.
- **Missing UA is `bot`, not unclassified.** `describeVisitor(undefined)` returns
  `{ class: 'bot' }`, so metric 5 undercounts genuine ambiguity; `class` is left unset only
  where there is no request context at all (e.g. the Nitro error hook).
- **Classification is UA string matching.** A spoofed or novel agent UA lands in `human`.
  The taxonomy is only as current as `layer/shared/ai-agents.ts`.

## 5. Non-goals

- **No Foundry-side compute.** No aggregate endpoint, no counters, no report route, no UI.
  Scope for this bead is zero new Foundry code; the §3 gap was a separate capture fix
  (`product-validator-m0f.15`), now landed.
- **No real-time.** The consumer polls a cursor. Freshness is the poll interval; nothing
  here is a live counter.
- **No session stitching.** This report deliberately does not try to join server rows to client `ui.*` rows by
  `page` + `ts` proximity — that heuristic would manufacture the double-count §2 forbids.
- **No bot-vs-agent adjudication beyond the UA.** No reverse-DNS, no IP-range verification,
  no behavioural inference. If the UA lies, the row lies.
- **No retention or warehousing spec.** How long Polaris keeps exported rows is a Polaris
  concern; Foundry's buffer is a hand-off window, not storage.
