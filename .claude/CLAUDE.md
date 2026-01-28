# Founder Funnel

A validation tool for technical founders — captures signal (email, presales, bookings) to prove demand before building product.

## Quick Start

```bash
pnpm dev:ff          # Founder Funnel dev server
pnpm dev:ae          # Astronera dev server
pnpm dev:web         # Starter web dev server
pnpm dev:docs        # Starter docs dev server
pnpm build:ae        # Production build (astronera)
pnpm lint            # ESLint check
pnpm lint:fix        # ESLint autofix
pnpm test            # Run tests
pnpm typecheck       # Nuxt typecheck (layer)
pnpm verify          # dev:prepare + lint + typecheck
```

Config source: set `NUXT_PUBLIC_CONFIG_SOURCE=root` or `founder-funnel`.

## Critical Rules

1. **Never add features that don't capture signal.** If it doesn't help founders validate faster, reject it.
2. **Never build custom when VueUse/library exists.** Priority: VueUse → library → custom (last resort). Check composables.vueuse.org first.
3. **Validation ≠ Product.** Email sequences, auth, payment processing, gated content are product features — out of scope.
4. **Complexity budget:** max 50 lines per component, max 5 props, max 2 abstraction layers, max 3 nesting levels.
5. **Content in YAML/Markdown, not hardcoded.** Customers edit content files, not code.
6. **Ship first, optimize later.** Ship working → measure → optimize what data proves necessary.

## Architecture

**In scope:** Landing pages (section-driven), signal capture (email/presales/bookings), event tracking (analytics-agnostic), webhook streaming.

**Out of scope:** Email sequences, authentication, payment processing, databases. Use external tools for these.

**Key patterns:**
- Multi-config: `NUXT_PUBLIC_CONFIG_SOURCE` switches between configs. See `shared/utils/config-resolver.ts`.
- Event-driven: action → `useEvents()` → handler → provider. Swap analytics without changing event code. See `modules/events/*`.
- Webhook streaming: capture → encrypt → webhook → destination. No storage needed. See `modules/events/server/handlers/webhook.ts`.
- SSR: Nuxt 4, use `import.meta.client` guards for client-only APIs or `.client.ts|.server.ts` file naming.

## File Locations

```bash
layer/                         → Nuxt layer (core reusable code)
examples/founder-funnel/       → Founder Funnel example app
examples/astronera/            → Astronera example app
examples/starter/              → Starter template
shared/config/                 → Configuration files
shared/types/                  → TypeScript types
deploy/                        → Dockerfiles and deployment configs
```

## Common Tasks

- **Add new section:** Copy existing section component, edit `content/*.yml`
- **Change validation path:** Edit `app/components/convert/*`
- **Add event tracking:** Use `useEvents()` composable
- **Deploy:** Standard Node.js/Docker — Dockerfile + `vercel.json` included

## Before You Code

1. Does VueUse solve this? (composables.vueuse.org)
2. Does an existing component handle this?
3. Is this solving a real or imagined problem?
4. Will this capture signal faster?

If all answers are "No" → don't build it.

## Rules

Detailed rules are in the `.claude/rules/` directory:
- @.claude/rules/architecture.md — System boundaries and integration points
- @.claude/rules/conventions.md — Naming, component rules, code patterns
- @.claude/rules/decisions.md — Boundary decisions and decision framework
- @.claude/rules/anti-patterns.md — What to never do, red flags, values filter
