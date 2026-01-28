## Feature/Function Planning Priority

1. Nuxt Modules (if exists) https://cdn.jsdelivr.net/npm/@nuxt/modules@latest/modules.json
2. VueUse (if exists) use vueuse skill
2. Unjs (if exists, higher priority for server side functions) https://unjs.io/packages?q=&order=-1&orderBy=monthlyDownloads
3. External library
4. Inline (single use only)
5. Local composable

Never build custom if a battle tested option exists.
Unless custom adds MASSIVE value

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

**Pages/Layouts:** kebab-case
```
my-layout.vue
page.vue
```

**Events:** `{action}_{target}`
```
email_submit
booking_click
link_click
```

**Booleans:** `is` or `has` prefix
```
isValidEmail
isLoading
hasPermission
```

## Component Rules

**Max 50 lines:**
If longer → Extract composable or split component

**Max 5 props:**
If more → Use config object prop

**No prop drilling:**
If passing >2 levels → Use composable or provide/inject

**Examples:**
See: `layers/base/app/components/convert/Email.vue` (good)
See: `layers/base/app/components/section/SectionWrapper.vue` (composables not props)

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
layer/app/components/convert/   → Signal capture (Email, Booking)
layer/app/components/section/   → Landing sections (Hero, Benefits)
layer/app/components/nav/       → Navigation (Header, Footer)
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
