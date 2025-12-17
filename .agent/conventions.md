# Conventions

## Function Priority

1. VueUse (if exists)
2. External library
3. Local composable
4. Inline (single use only)

Never build custom if library exists.

## Naming

**Components:** PascalCase
```
EmailCapture.vue
SectionHero.vue
```

**Composables:** camelCase + `use` prefix
```
useEvents.ts
useContentCache.ts
```

**Events:** `{action}_{target}`
```
email_submit
booking_click
link_click
```

**Booleans:** `is_` prefix
```
is_valid_email
is_loading
```

## Component Rules

**Max 50 lines:**
If longer → Extract composable or split component

**Max 5 props:**
If more → Use config object prop

**No prop drilling:**
If passing >2 levels → Use composable

**Examples:**
See: `app/components/convert/Email.vue` (good)
See: `app/components/section/SectionWrapper.vue` (composables not props)

## Code Patterns

**Storage:**
```typescript
// Never direct localStorage
const { local } = useAppStorage();
local.set('key', value); // Prefixed + SSR-safe
```

**Content Queries:**
```typescript
// Never direct queryCollection
const { getOffer } = useContentCache();
const { data } = await getOffer('slug');
```

**Event Tracking:**
```typescript
const { trackEvent } = useEvents();
await trackEvent({
  id: 'email_submit',
  type: 'form_submitted',
  location: 'hero',
  // ...
});
```

## Ship-First Checklist

**Ready when:**
- ✓ Core path works
- ✓ Error states handled
- ✓ Basic tests pass

**Defer:**
- ✗ All edge cases
- ✗ Perfect error messages
- ✗ Comprehensive logging

Ship working → Iterate based on data

## File Locations

**Component types:**
```
app/components/convert/   → Signal capture (Email, Booking)
app/components/section/   → Landing sections (Hero, Benefits)
app/components/nav/       → Navigation (Header, Footer)
```

**Composables:**
```
useEvents         → Event tracking
useContentCache   → Content queries
useAppStorage     → Storage abstraction
useUserIdentity   → Anonymous ID
```

## Testing Commands

```bash
pnpm test          # Run tests
pnpm lint          # Check code
pnpm build         # Production build
```

**Before commit:**
1. Tests pass
2. Lint passes
3. `/offers/[slug]` route works
