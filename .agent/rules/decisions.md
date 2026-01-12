---
trigger: always_on
---

## Current Boundaries

**No email sequences:**
Validation captures intent. Delivery = product feature.
Use external: ConvertKit, Mailchimp, etc.

**No authentication:**
Tracking users = product problem, not validation problem.
Anonymous ID sufficient for signal capture.

**No payment processing:**
External links (Stripe, LemonSqueezy) prove payment intent.
Internal processing of transactions = product feature.

**Webhooks not storage:**
Own your data. Choose destination (Slack → CRM).
No database decisions required.

## Decision Framework

**Before building anything:**
1. Does this capture signal faster?
  - No → Reject
  - Yes → Continue
2. Does external tool solve this?
  - Yes → Use external tool
  - No → Continue
3. Will this be used >2 places?
  - No → Build inline
  - Yes → Build reusable
4. Ship minimal → Iterate based on data

## Three Validation Paths

**Email capture:**
Anonymous ID + UTM tracking + webhook
Best for: Testing interest before content creation

**Presales links:**
External payment (Stripe/LemonSqueezy)
Best for: Proving payment intent

**Service booking:**
Consultation scheduling (Cal.com/Calendly)
Best for: Revenue while learning what to build

## Integration Choices

**Analytics: Umami (default)**
Why: Privacy-first, self-hosted, good enough
Swap: Change scripts registry in `nuxt.config.ts`

**Deployment: Railway/Vercel or other PAAS**
Dockerfile + `vercel.json` configs included

**Webhooks: Telegram/Discord/Slack**
Why: Start simple, own your data
Scale: Move to CRM when ready
