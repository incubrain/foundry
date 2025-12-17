# Founder Funnel

> **Stop paying for landing pages. Start owning your validation.**

<div align="center">

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fincubrain%2Ffounder-funnel)
&nbsp;&nbsp;
[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/usbhW2?referralCode=gvXQKE)

</div>

---

## The Problem

You're stuck in the loop:

- "Just one more feature before I launch"
- "The design isn't perfect yet"
- "I need to add this integration first"

Meanwhile, landing page builders charge $50-300/month. Your content is locked in their platform. Migration means rebuilding from scratch.

**You waste months building. Then discover nobody wants it.**

---

## The Solution

Founder Funnel is an open-source landing page template that helps you **prove demand before you build anything**.

- **Deploy in 15 minutes** — Live site, capturing signal, tracking conversions
- **$0/month forever** — Your code, your hosting, your data
- **Multiple validation paths** — Email signups, presales, service bookings
- **Own your stack** — No vendor lock-in, swap any tool anytime

**Built with:** Nuxt 4 · Tailwind v4 · TypeScript

---

## What You Get

A complete validation system designed around one question:

**"Is there real demand for this?"**

### Signal Capture

Multiple validation paths depending on your offer:

**Email capture** — Visitors convert to leads for your free magnet  
**Presales** — Collect payment before building the product  
**Service bookings** — Sell consultation calls, learn from delivery, systematize into product

Each path generates evidence. You measure signal, then decide.




### Conversion-Optimized Sections

Hero · Benefits · Outcome · Product · Testimonials · FAQ

Built to convert. Not to look pretty in your portfolio.

### Zero Lock-In

Standard Nuxt app. Swap analytics providers in 5 minutes. Change hosting in 10. Add any integration you want. **You control everything.**

---

## Validation Paths

### Path 1: Email Capture (Free Magnet)

Offer valuable content in exchange for email signup. Measure conversion rate to validate interest before creating the full deliverable.

**When to use:** Testing demand for courses, guides, frameworks, templates.

### Path 2: Presales (Paid Before Build)

Sell the product before you build it. Payment is the strongest signal.

**When to use:** Digital products, cohort-based courses, software tools.

### Path 3: Service Bookings (Learn Then Systematize)

Sell consulting calls. Deliver service manually. Learn what clients actually need. Systematize the process. Build the product that solves it.

**When to use:** Unclear product-market fit, need revenue while validating, domain expertise without product clarity.

**Philosophy:** Service delivery teaches you what to build. Client feedback reveals real pain points. Systematization creates your product roadmap.

---

## Who This Is For

### Good Fit

- **Technical founders** validating SaaS or digital product ideas
- **Experienced developers** (3+ years) who can edit config files
- **Service providers** ready to systematize their delivery
- **Perfectionists** who need constraints to ship

### Not a Fit

- Non-technical founders needing drag-and-drop builders
- Anyone wanting fully managed no-code solutions
- Post-PMF companies already scaling validated products

---

## Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/incubrain/founder-funnel.git
   cd founder-funnel
   pnpm install
   ```

2. **Customize Content**
   
   Edit `content/pages/index.md` — uncomment sections as you need them:
```markdown
   <!-- Start minimal: Hero + Product only -->
   ::section-hero
   ::
   
   ::section-product
   ::
   
   <!-- Uncomment when driving traffic -->
   <!-- ::section-benefits
   :: -->
```
   
   Then edit `content/config/site.yml` with your business info.

3. **Set Up Webhooks**
   
   Configure where leads go (Telegram, Slack, Discord):
```bash
   cp .env.example .env
   # Add your webhook URL
   NUXT_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

4. **QR Codes for In-Person Distribution** _(Optional)_
   
   Generate trackable QR codes for events, flyers, or business cards.
   
   **Recommended tool:** [Dub.co](https://dub.co) (free tier: 1K clicks/mo)
   
   **Quick setup:**
```bash
   # 1. Sign up at dub.co
   # 2. Create short links for your offers:
   #    /offers/mentorship → go.yourdomain.com/mentor
   #    /offers/template → go.yourdomain.com/template
   
   # 3. Per campaign (conference, meetup, etc):
   #    - Open link in Dub dashboard
   #    - Add UTM: utm_campaign=techcrunch2024
   #    - Download QR code
```
   
   **Alternatives:** bit.ly, rebrandly, or any URL shortener with QR generation.

5. **Deploy**
   
   ```bash
   pnpm run build
   # Deploy to Vercel, Railway, or your host
   ```

## Content Structure

The template uses **progressive disclosure**—start minimal, expand as you validate.

### Editing Content

Open `content/pages/index.md` and follow the inline guides:
```markdown
::section-hero
---
data:
  intro:
    # Answer: What problem do you solve? For whom?
    title: Your Outcome-Focused Headline
---
::
```

Each section includes:
- **Decision guides** — When to use this section
- **Anti-examples** — What NOT to write  
- **Structure templates** — How to organize your copy

No config files. Just uncomment sections as you grow.

---

## Understanding the Codebase

No docs that go stale. Instead:

```bash
pnpm repomix
```

This bundles your codebase context into a single file. Paste it into Claude or ChatGPT.

**Ask anything:**
- "How do I change the color scheme?"
- "Where do I configure email webhooks?"
- "How do I hide a section?"
- "How do I add a presales funnel?"

The LLM explains the code directly. Always up-to-date. Zero maintenance.

---

## What We Deliberately Cut

This template does **not** include:

- ❌ Email sequence automation
- ❌ User authentication systems
- ❌ Payment processing (external links only)
- ❌ Content delivery platforms
- ❌ Database management
- ❌ Admin dashboards

**Why?**

These add complexity that distracts from validation. Once you prove demand, add them to your **actual product** codebase.

The template captures signal. Your product delivers value.

---

## Validation Philosophy

### Measure What Matters

Stop chasing traffic. Focus on **signal**:

- **Email signups** — Are people interested enough to give you their contact?
- **Presale conversions** — Are people interested enough to pay before you build?
- **Service bookings** — Are people interested enough to pay for your time?

Quality of signal matters more than quantity of visitors.

### Fail Fast, Fail Early

Weak signal? Your offer doesn't resonate. Pivot or kill the idea.

This is success. You saved months of building something nobody wants.

### Service-to-Product Path

Can't validate with a landing page? Sell service first:

1. Offer paid consulting/implementation
2. Learn what clients actually need
3. Systematize your process
4. Build the product that solves it

Your template supports this path. Service revenue funds validation. Client feedback guides product development.

---

---

## Decisions Log

We document every strategic decision, pivot, and learning in our public [Decisions Log](/decisions).

**Why?**
- **Transparency:** See how we think, not just what we ship
- **Learning:** Real validation decisions from real founders
- **Accountability:** Public decisions force clear reasoning

**Subscribe via RSS:** [/decisions.xml](/decisions.xml)

Perfect for:
- Investors monitoring portfolio thinking
- Founders learning from validation experiments
- Mentors assessing decision quality

---

## Contributing

Found a bug? See a better way? Pull requests welcome for:

- Bug fixes
- Documentation improvements  
- New validation path examples
- Performance optimizations

**Not accepting:** Feature additions that violate "best part is no part" philosophy.

---

## License

MIT — Use for personal or commercial projects.

**One restriction:** Don't clone this and sell it as a competing template product under a different name.

Everything else? Fair game.

---

## Support

- **Issues:** [GitHub Issues](https://github.com/incubrain/founder-funnel/issues)
- **Discussions:** [GitHub Discussions](https://github.com/incubrain/founder-funnel/discussions)
- **Decisions Log:** [Strategic Decisions](https://founder-funnel.incubrain.org/decisions)
- **RSS Feed:** [Subscribe](https://founder-funnel.incubrain.org/decisions.xml)

---

**Stop overthinking. Start validating.**

Deploy your landing page today. Measure real signal tomorrow. Build only when the evidence is clear.

Your future self will thank you.