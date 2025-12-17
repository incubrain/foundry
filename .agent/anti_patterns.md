# Anti-Patterns

## Never Do This

**Never add features "just in case":**
Triggers: "might need", "users will want", "competitor has"
Rule: If not capturing signal → Reject

**Never build custom when library exists:**
Priority: VueUse → Library → Custom (last resort)
Check: composables.vueuse.org before writing anything

**Never optimize before shipping:**
Ship working → Measure → Optimize what data proves necessary
Examples removed: Sequences, auth, payment processing (out of scope)

**Never mix validation + product:**
Validation = captures intent
Product = delivers value
Don't confuse the two

**Never prop drill >2 levels:**
Use composables instead
See: `useContentCache()` vs passing props through SectionWrapper

**Never ignore complexity budget:**
Component >50 lines → Refactor
Props >5 → Config object
Abstraction >2 layers → Too deep

## Red Flags 🚩

Before building, check for these:
- "This would be nice to have"
- "Users might want this someday"
- "Competitor X has this"
- "It's only X more lines"
- "We should future-proof this"
- "Let's add this just in case"

If you hear any → Run through Values Filter

## Values Filter

```
Does this help founders validate faster?
├─ No → Reject
└─ Yes → Does external tool solve this?
    ├─ Yes → Use external tool
    └─ No → Ship minimal version
            ↓
         Iterate based on usage data
```

## Boundary Violations

**Building product features:**
Email sequences, auth, payment processing, gated content
→ All removed. Validation ≠ product.

**Configuration complexity:**
Adding options nobody asked for
→ Max 5 props. Start minimal.

**Premature optimization:**
Retry logic, circuit breakers, connection pooling
→ Ship simple. Add when metrics prove need.
