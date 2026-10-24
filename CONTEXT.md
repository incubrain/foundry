# CONTEXT.md

Reference detail for this repository — project architecture, file locations, workflows,
and tooling notes. `CLAUDE.md` holds the operating rules (critical
rules, the short-output-only rule for Bash) and links here for
anything reached only for deep work. Canonical terms are in `GLOSSARY.md`.

## Quick Start

```bash
pnpm dev:foundry     # examples/foundry dev server (local layer)
pnpm dev:playground  # playground dev server on :3100

pnpm lint            # ESLint check
pnpm lint:fix        # ESLint autofix
pnpm test            # Run tests
pnpm typecheck       # Nuxt typecheck (layer)
pnpm verify          # dev:prepare + lint + typecheck
pnpm test:e2e        # playground e2e (boots a real Nuxt server per spec; also a CI job)
pnpm smoke <url>         # HTTP smoke against any Foundry site (server contract)
pnpm smoke:browser <url> # browser smoke: render, hydrate, console errors, ui.page telemetry
```

Smoke runner flags, where to point them and how to read their reports: `docs/debugging.md`.

## External consumer repos

These consume the published `@incubrain/foundry` layer (separate git repos):

- `astronera` → `/Users/mac/Development/astronera/astronera` (`@astronera/web`)
- `incubrain` → check `/Users/mac/Development/incubrain/incubrain-founder` or similar before assuming

When verifying a layer change against a consumer, see the verdaccio workflow below.

## Testing layer changes in external consumers (verdaccio)

For external consumer repos like `astronera` or `incubrain` that don't share this
workspace, use a **local verdaccio registry**. pnpm's `link:` protocol doesn't work
cleanly cross-repo (cross-tree ESM resolution + isolation boundary issues — see the
deep-dive in past bd issues).

### One-time setup

```bash
pnpm i -g verdaccio          # global install, ~30s
pnpm verdaccio:start         # in a dedicated terminal — keep it running
```

The config at `.verdaccio/config.yaml` allows the local `foundry-local` user to publish
`@incubrain/*` packages. The user gets registered automatically on the first
`publish:local` run; the token is cached in `.verdaccio/auth-token` (gitignored).

### Publishing the local layer

```bash
pnpm layer:publish:local
```

Each publish gets a unique prerelease version (`0.7.0-local.<epoch>`) tagged `local` in
verdaccio. The `latest` tag stays untouched, so consumers never accidentally pick up a
local build via `^X.Y.Z`. Your `layer/package.json` is restored after the publish —
uncommitted changes are preserved.

### Consumer-side setup

In each consumer repo (astronera, incubrain), add four scripts + the pre-commit guard:

```json
"scripts": {
  "postinstall":        "nuxt prepare && simple-git-hooks",
  "foundry:local":      "pnpm add @incubrain/foundry@local --registry http://localhost:4873",
  "foundry:remote":     "pnpm add @incubrain/foundry@^0.7.0",
  "dev:foundry-local":  "pnpm foundry:local && pnpm dev",
  "build:foundry-local":"pnpm foundry:local && pnpm build"
},
"devDependencies": {
  "simple-git-hooks": "^2.11.1"
},
"simple-git-hooks": {
  "pre-commit": "bash scripts/foundry-guard.sh"
}
```

And `scripts/foundry-guard.sh` (the pre-commit hook):

```bash
#!/usr/bin/env bash
set -e
if git diff --cached --name-only | grep -qx 'package.json'; then
  if git diff --cached package.json | grep -E '^\+.*"@incubrain/foundry"\s*:\s*"(link:|file:|[0-9]+\.[0-9]+\.[0-9]+-local\.)' >/dev/null; then
    echo "❌ package.json has @incubrain/foundry pointing at a local-only version."
    echo "   Run 'pnpm foundry:remote' before committing."
    exit 1
  fi
fi
```

### Iteration loop

```bash
# foundry: make changes in layer/, then:
pnpm layer:publish:local

# consumer (in a separate terminal):
pnpm foundry:local && pnpm dev
# or: pnpm dev:foundry-local
```

Each cycle takes ~3-5 seconds for publish, ~3-5 seconds for the consumer install. Total
round-trip ~10 seconds.

### Before committing in the consumer

```bash
pnpm foundry:remote
```

The pre-commit guard blocks accidental commits of `@local` versions. If you somehow get
past it, CI will fail because the `0.7.0-local.<epoch>` version doesn't exist on public npm.

### Adding any new layer file to the published package

If you add a file to `layer/` that should ship with the package — a new module, a server
util, etc. — add it to the `files:` array in `layer/package.json`. Otherwise it's stripped
at publish time and consumers will see "module not found" errors.

## Local layer vs published npm package

**By default, `examples/foundry` and other examples consume the local `layer/` workspace**
— `examples/foundry/package.json` declares `"@incubrain/foundry": "workspace:^"`, and
`.npmrc` has `link-workspace-packages=true`. Any change you make in `layer/` is immediately
picked up by `pnpm dev:foundry` / `pnpm build:foundry` without needing to publish.

**To verify the published npm package (`@incubrain/foundry@<version>`) builds cleanly** —
useful before cutting a release — temporarily swap the spec. TWO gotchas (learned 2026-09-05):
`pnpm add @incubrain/foundry@<exact> --registry …` inside this workspace silently keeps the
workspace symlink while `link-workspace-packages=true` is set in `.npmrc` — comment that line
out (the .npmrc comment says so) AND add `@incubrain:registry=http://localhost:4873` for a
verdaccio version, then `rm -rf examples/foundry/node_modules && pnpm install`. That install
re-resolves the graph and can trip `minimumReleaseAge` on versions the lockfile already holds —
pass `--config.minimumReleaseAge=0` for that one install (it resolves to the already-locked
versions, nothing newer). Revert `.npmrc` + package.json + lockfile when done:

```bash
# Switch examples back to the published package
(cd examples/foundry && pnpm add '@incubrain/foundry@^0.7.0')
pnpm build:foundry

# Switch back to local
(cd examples/foundry && pnpm add '@incubrain/foundry@workspace:^')
```

**`playground/` always uses local layer** (`workspace:*`) — it's the canonical target for
`pnpm --filter playground build` regression checks.

If `pnpm build:foundry` fails with errors that reference
`node_modules/.pnpm/@incubrain+foundry@<version>/...`, examples is on the published
package and the error is in that release, not your local work.

## Architecture

**In scope:** Landing pages (section-driven), signal capture (email/presales/bookings),
event tracking (analytics-agnostic), signal export for an external consumer to pull.

**Out of scope:** Email sequences, authentication, payment processing, databases. Use
external tools for these.

**Key patterns:**
- Event-driven: action → `useEvents()` → handler → provider. Swap analytics without
  changing event code. See `modules/events/*`.
- Signal pull, not webhook push: client events, server errors, and form captures all
  call `appendSignal()` (`layer/modules/events/server/utils/signal-buffer.ts`) into a
  capped, time-retained ring buffer (`useStorage('signals')`, 170,000-row default / 14-day
  retention — sized for the always-on identity-event stream). Memory by default; set
  `NUXT_SIGNAL_STORE_DIR` to a directory (e.g. a Railway Volume mount path) to persist it
  to disk across restarts (`server/plugins/signal-storage.ts`). Ingest lands via
  `POST /api/_signals/ingest` (client rows), `POST /api/v1/webhook` (form capture),
  `POST /mcp` tool calls (`layer/server/utils/mcp-signal.ts` → `mcp_tool_called`, always
  `visitor.class: 'agent'`), and every document GET
  (`layer/modules/events/server/middleware/page-request.ts` → `page_request`, the only
  ingest path a visitor that runs no JavaScript reaches), outbound-link/download clicks
  (`ui.outbound`) and a thrown 404 (`http.not_found`, from the catch-all page); an external
  consumer pulls everything back out with `GET /api/_signals/export` (bearer
  `NUXT_SIGNAL_EXPORT_TOKEN`, `since`/`limit` params). There are no outbound webhooks and no
  analytics providers — see `layer/modules/events/AGENTS.md`, which also carries the
  `page_request` vs `ui.page`
  dedupe rule (they are different facts; never sum them).
- AI-crawler policy: `layer/modules/ai-robots.ts` writes robots.txt groups from the same
  UA taxonomy the visitor classifier uses (`layer/shared/ai-agents.ts`). Answer engines
  (`OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`, the `*-User` fetchers) are always
  allowed; training crawlers (`GPTBot`, `Google-Extended`, `CCBot`, …) default to `allow`
  and are flipped per site with `aiRobots: { training: 'disallow' }` in nuxt.config. The
  same grouping is what `visitor.subclass` reports on every row
  (`search` / `live-user-fetch` / `training` / `automation`), additive to the unchanged
  `visitor.class` enum.
- Monitorability: `GET /api/_health` (`layer/server/api/_health.get.ts`) gives external
  monitors (Polaris) an unauthenticated liveness+identity check — `{ ok, service, version,
  siteId, timestamp, buildId, signals: { driver, epoch } }`, `no-store`, no per-request
  storage I/O. `signals` is lineage (`memory`|`fs`, and the buffer `epoch`), never volume.
  `GET /api/_signals/export` (bearer) adds `epoch` and `meta` (`driver`, `rows`, `headSeq`,
  `oldestSeq`, `oldestTs`, `capacity`, `retentionDays`, `evictedSinceBoot`) to every page;
  a changed `epoch` means the buffer restarted and the consumer must reset its cursor. Page
  enumeration is `/sitemap.xml` (via `@nuxtjs/seo`).
- SSR: Nuxt 4, use `import.meta.client` guards for client-only APIs or
  `.client.ts|.server.ts` file naming.

## File Locations

```bash
layer/                         → Nuxt layer (core reusable code)
layer/modules/                 → Feature modules (events, rss)
examples/foundry/              → Founder Funnel example app
shared/config/                 → Configuration files
shared/types/                  → TypeScript types
deploy/                        → Dockerfiles and deployment configs
.claude/agents/                → Claude Code sub-agent definitions
.claude/scripts/                → Utility scripts for agents
```

## Common Tasks

- **Add new section:** Copy existing section component, edit `content/*.yml`
- **Change validation path:** Edit `app/components/convert/*`
- **Add event tracking:** Use `useEvents()` composable
- **Deploy:** Standard Node.js/Docker — Dockerfile + `vercel.json` included
- **Visual UI review:** Use the `browser-tester` sub-agent — see Visual Testing below

## Module Guides

Each module has its own AGENTS.md with detailed architecture, file maps, and modification
guides. Read the relevant guide when working on that module (not autoloaded):

- [layer/modules/events/AGENTS.md](layer/modules/events/AGENTS.md) — Event tracking and signal export
- [layer/modules/rss/AGENTS.md](layer/modules/rss/AGENTS.md) — RSS feed generation

> The `changelog` module (`Changelog.vue`, `useChangelog`, `changelog` collection) was removed —
> a validation page has no need for a changelog.

> The `docs` module (docs-site engine + scholarly toolkit) was extracted to the
> `@incubrain/foundry-docs` repo. Foundry no longer ships a documentation site.

## Skills

Agent skills extend capabilities for specialized tasks; the manifest of external skills
used by this project is `.claude/skills.json`.

**When to use skills:**
- **Development**: nuxt, nuxt-ui, nuxt-content, vue-best-practices, vitest, vueuse-functions, pinia
- **Design**: frontend-design, theme-factory, web-design-guidelines
- **Marketing**: copywriting, marketing-psychology
- **Strategy**: brainstorming, systematic-debugging
- **Tools**: agent-browser, manage-mcp

**Skill priority:** Check skills first → VueUse → Library → Custom (last resort)

## Visual Testing

Use the `browser-tester` sub-agent (or the `agent-browser` skill directly) to detect UI/UX
bugs via annotated screenshots. The dev server must be running first (`pnpm dev:foundry`,
`pnpm dev:playground`, …) — see `docs/debugging.md` for the smoke runners and where to point
them.

**When to use:**
- After implementing UI changes — verify layout, spacing, and styling
- Before merging — catch visual regressions
- When investigating reported visual bugs — capture evidence with screenshots

**Quick start:**
```bash
# One-command review (wrapper script)
bash .claude/scripts/visual-review.sh http://localhost:3000 [optional-selector]

# Manual workflow
npx agent-browser open http://localhost:3000
npx agent-browser wait --load networkidle
npx agent-browser screenshot --annotate --full
npx agent-browser close
```

**Sub-agents:** `.claude/agents/browser-tester.md` defines the Browser Visual Tester — use
as a Claude Code sub-agent for visual review tasks.

**Observability:** Every `agent-browser` command is logged to `.claude/visual-test-log.md`
(gitignored) via a PostToolUse hook. Check this file to audit what commands were run
during a visual review session.

**`data-testid` selectors** for scoped reviews:
```bash
npx agent-browser snapshot -i -s "[data-testid='section-hero']"
npx agent-browser snapshot -i -s "[data-testid='convert-form']"
```

## Web access and large output

Context-mode (the `ctx_*` MCP tools and the hooks that blocked `curl`/`WebFetch`) was retired vault-wide on 2026-09-28. For web pages use Claude Code's own WebSearch / WebFetch. For large command output, filter in the pipe (`grep -c`, `head`, `jq`, or one script that prints only the answer) instead of routing through a sandbox.

## Relationships

- **Site Event vs Probe.** Site Events are recorded *by* the site (inside Foundry); Probes are made *of* the site from outside (Polaris). A Probe cannot be backfilled from the site, because the failures it exists to catch — expired domain, DNS pointing elsewhere, host down — never reach Foundry. The backfill evidence for a Polaris outage is the continuity of Site Events, which requires the Site Event buffer to be durable (not the default memory driver).
- **Foundry ends at the stream; Polaris owns interpretation.** Analytics (page views, scroll depth, …) are Site Events; bounce rate, durations and funnels are derived in Polaris from raw rows.

## Flagged ambiguities

- **"signal".** Foundry prose and code (`SignalRow`, `/api/_signals/export`) use "signal" for every recorded row; Polaris's glossary defines a *signal* as one of exactly four states (Aimed, Waiting on me, Rotting, Broken). In prose, say **Site Event** for Foundry rows. Code identifiers are unchanged for now.
