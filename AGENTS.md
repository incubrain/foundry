# Founder Funnel - Agent Guide

## Quick Start
- `pnpm dev` - Local development
- `pnpm build` - Production build
- Config source: Set `NUXT_PUBLIC_CONFIG_SOURCE=root` or `founder-funnel`

## Critical Rules
1. Never add features that don't capture signal
2. Never build custom when VueUse/library exists
3. Max 50 lines per component, 5 props max
4. Content in YAML, not hardcoded

See: `.agent/rules/anti-patterns.md` for violations

## Architecture Quick Ref
- Signal capture (email/presales/bookings)
- Event-driven analytics (swap providers anytime)
- Webhook streaming (no database)
- Multi-config (showcase ≠ user starting point)

See: `.agent/rules/architecture.md` for boundaries

## Common Tasks
- Add new section: Copy existing, edit `content/*.yml`
- Change validation path: Edit `app/components/convert/*`
- Add event tracking: Use `useEvents()` composable
- Deploy: Standard Node.js/Docker deployment

See: `.agent/conventions.md` for patterns

## File Locations
- Components: `app/components/`
- Content: `content/` or `examples/founder-funnel/content/`
- Config: `shared/config/`
- Types: `shared/types/`

## Before You Code
1. Does VueUse solve this? (composables.vueuse.org)
2. Does existing component handle this?
3. Is this solving real or imagined problem?
4. Will this capture signal faster?

If all "No" → Don't build it

## Testing
- `pnpm test` - Run tests
- `pnpm lint` - Check code
- Check `/offers/[slug]` route works
- Verify webhook delivery

## Red Flags 🚩
- "Might need someday"
- "Users will want this"
- "Competitor has this"
- "It's only N lines"
