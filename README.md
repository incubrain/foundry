# Founder Funnel

> **Stop paying for landing pages. Start owning your validation.**



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

2. **Setup Claude Code**

```bash
# Install Plugins
/plugin marketplace add onmax/nuxt-skills
/plugin marketplace add vercel-labs/agent-browser
```

2. **Customize Content**

Edit `content/pages/index.md` — uncomment sections as you need them:
```markdown
   <!-- Start minimal: Hero + Product only -->
   ::section-hero
   ::

   ::section-offer
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
# Deploy to your preferred hosting provider
```

---

## 📦 Keeping Your Template Updated

  Founder Funnel automatically syncs updates from the upstream template to your repository.

### How It Works

  1. **Automatic Updates** — Every month, GitHub Actions checks for template updates
  2. **Pull Request** — If changes exist, you'll receive a PR with updates
  3. **Review & Merge** — Review changes, test locally, then merge

### Manual Update

  Don't want to wait for the monthly sync? Trigger an update manually:

  1. Go to **Actions** tab in your repository
  2. Click **Template Sync** workflow
  3. Click **Run workflow** → **Run workflow**
  4. Wait ~1 minute for PR to appear

### What Gets Updated

  ✅ **Core files** (always synced):
  - `layers/base/*` — Template components, layouts, composables
  - `modules/events/*` — Event tracking system
  - `shared/*` — Shared configuration and utilities
  - `scripts/*` — Build and deployment scripts

  ❌ **Your content** (never synced):
  - `templates/*/content/**` — Your business content
  - `templates/*/nuxt.config.ts` — Your template config
  - `.env*` — Your environment variables

  ⚠️ **Hybrid files** (may conflict):
  - `shared/config/navigation.ts` — May need manual merge
  - Root `nuxt.config.ts` — Review carefully
  - Root `package.json` — Dependency updates

### Reviewing Template Updates

  When you receive a template sync PR:

  1. **Check the "Files changed" tab** — See exactly what changed
  2. **Look for breaking changes** — Read PR description
  3. **Test locally** (recommended):
```bash
gh pr checkout <PR_NUMBER>  # GitHub CLI
pnpm install
pnpm dev
```
  4. **Merge or close** — Your choice

### Resolving Conflicts

  If the PR shows merge conflicts (rare):

  1. **Checkout the PR branch** — `gh pr checkout <PR_NUMBER>`
  2. **Resolve conflicts** — Edit conflicted files
  3. **Commit resolution** — `git add . && git commit -m "resolve conflicts"`
  4. **Push** — `git push`

  Most conflicts will be in `shared/config/*` if you customized navigation.

### Disabling Auto-Updates

  Don't want automatic syncs? You have two options:

  **Option 1: Delete the workflow** (permanent)
```bash
rm .github/workflows/template-sync.yml
git commit -am "disable template sync"
git push
```

  **Option 2: Disable in GitHub UI** (temporary)
  1. Go to **Actions** tab
  2. Click **Template Sync** workflow
  3. Click **⋯** (three dots) → **Disable workflow**

### Ignoring Specific Files

  Customized a core file and don't want it synced? Add it to `.templatesyncignore`:

```bash
# Example: You customized the navigation config
echo "shared/config/navigation.ts" >> .templatesyncignore
git commit -am "ignore custom navigation"
git push
```

  ⚠️ **Warning:** Ignoring core files means you won't receive bug fixes for them.

### Troubleshooting

  **PR not appearing?**
  - Check **Actions** tab for workflow run status
  - Ensure GitHub Actions is enabled (Settings → Actions → General)
  - Verify no error messages in workflow logs

  **Workflow failing?**
  - Check workflow logs for error details
  - Common issue: Missing permissions (should auto-configure)
  - Try manual trigger to see detailed logs

  **Too many PRs?**
  - Old PRs are auto-closed when new one appears
  - If needed, manually close old ones

  **Need help?**
  - [GitHub Discussions](https://github.com/incubrain/founder-funnel/discussions)
  - [Template Sync Docs](docs/template-updates.md)

---

## 📚 Authority Documentation (Beta)

Build domain authority alongside validation using our integrated **documentation system**.

### Why Authority Matters

After validation proves demand exists, you need **differentiation**. Properly cited, expert-level content:
- Positions you as the domain expert
- Creates hard-to-replicate competitive moat
- Builds trust that converts visitors to customers

### Quick Start

**Run both app and docs together:**
```bash
pnpm dev
# App:  http://localhost:3000
# Docs: http://localhost:3001
# MCP:  http://localhost:3001/api/mcp
```

**Or run individually:**
```bash
pnpm dev:app   # Main app only (port 3000)
pnpm dev:docs  # Docs only (port 3001)
```

### Example: Dark Sky Maharashtra

See `/docs` for complete case study:
- Government policy citations
- Academic research references
- Implementation guides
- MCP-enabled for AI tools

### Key Features

**Auto-discovering citations**
- Write `:reference{}` inline
- References auto-collect and render
- No manual listing needed

**Smart cross-linking**
- Auto-tracks links between pages
- Shows bidirectional references ("Referenced By")
- Displays related content based on tags, categories, and links
- Visual indicators for different link types (policy, research, implementation)

**MCP Resources**
- Upload source PDFs
- Expose to AI tools automatically
- LLMs can access original documents

**Sources tracking**
- Single page lists all sources
- Verification dates visible
- Credibility indicators

**Optional, not required**
- Validation works without docs
- Use docs for differentiation
- Deploy separately if needed

---

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

  **Subscribe via RSS:** [/rss/decisions](/rss/decisions)

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
- **RSS Feed:** [Subscribe](https://founder-funnel.incubrain.org/rss/decisions)

---

  **Stop overthinking. Start validating.**

  Deploy your landing page today. Measure real signal tomorrow. Build only when the evidence is clear.

  Your future self will thank you.
