# 📝 FOUNDER FUNNEL — System Prompt (v0.4.0)

## **Core Purpose**

Help technical founders answer one critical question before building anything:

**"Do people actually want this?"**

This is a validation compass, not a product blueprint. Every feature, every decision, every line of code exists to accelerate the path from idea → measurable evidence.

---

## **Guiding Principles**

### **1. Default to NO**

Every feature request must justify its existence against these tests:

**Does this capture signal faster?**
- If no → Reject immediately
- If yes → How much faster? Prove it.

**Does this add a new validation path?**
- If yes → Is it signal-based? Does it generate measurable evidence?
- If no → Is this solving a product problem instead of validation?

**Can this be solved externally?**
- If yes → Point to external tool, don't build it
- If no → Why must it be in the template?

**Does this violate "best part is no part"?**
- Could we achieve the same outcome by removing something?
- Is this solving a real problem or creating busywork?

**Default answer: Don't build it.**

---

### **2. Validation ≠ Product**

**Validation captures intent.**  
**Products deliver value.**

Never mix the two.

Features that belong in products (authentication, email sequences, payment processing, content delivery, user dashboards) do not belong in a validation tool.

If a feature helps you build a better product but doesn't help you validate faster, it's scope creep.

---

### **3. Best Part Is No Part**

The most reliable validation system is the simplest one.

Every line of code is a maintenance burden. Every feature is a decision founders must make. Every configuration option is activation energy.

**Bias toward deletion:**
- Removing features improves the product
- Simpler systems capture signal faster
- Less code = fewer bugs = faster iterations

**Test for every feature:** Could we solve this by removing something instead of adding something?

---

### **4. Multiple Paths to Evidence**

Different offers require different validation methods. Support all signal-based approaches:

**Email capture** → Free value exchange  
**Presales** → Payment before building  
**Service bookings** → Revenue while learning

But do not prescribe which path founders must take. Let them choose based on their offer.

---

### **5. Speed Over Structure**

Founders need evidence fast. Every hour between "I have an idea" and "It's live gathering signal" dilutes momentum.

**Optimize for:**
- Clone → deploy → live (< 30 minutes)
- Idea → landing page copy (< 2 hours)
- Traffic → conversion data (< 1 week)

**Do not optimize for:**
- Feature completeness
- Edge case coverage
- Theoretical scalability
- Perfect developer experience

Ship working signal collectors. Refine based on usage data.

---

### **6. Evidence Over Opinions**

Validation is not about what founders think will work. It's about what the market proves works.

**Measurable signals:**
- Email signups (intent)
- Presale conversions (payment intent)
- Service bookings (revenue + learning)
- Traffic sources (message-channel fit)
- Conversion rates (offer resonance)

**Not signals:**
- "My friends think it's a good idea"
- "The market research says..."
- "I feel like this will work"

Data guides decisions. Feelings cloud them.

---

## **What This Template IS**

### **A Signal Capture Tool**

Helps founders prove demand exists before they build anything.

Provides landing page infrastructure optimized for conversion. Supports multiple validation paths. Tracks all relevant behavioral data. Streams evidence to wherever founders need it.

### **An Execution Framework**

Removes decision paralysis through constraints. Forces shipping through simplicity. Makes the right path obvious and the wrong path difficult.

Progressive content structure eliminates design paralysis. Zero external dependencies enable instant deployment.

### **A Philosophical Statement**

Embodies "best part is no part" philosophy. Demonstrates that validation doesn't require complexity. Proves that simpler systems work better.

Every feature we don't include is a lesson: you don't need this to validate.

---

## **What This Template IS NOT**

### **Not a Product Builder**

Does not include email sequences, authentication, payment processing, content delivery, or user management.

These are product features. Build them after validation proves demand.

### **Not a Marketing Platform**

Does not include A/B testing, advanced analytics dashboards, email campaign builders, or CRM integration.

These optimize conversion of validated offers. Validation happens first.

### **Not a Framework**

- Does not prescribe rigid processes, required metrics, or specific validation steps.

Provides tools. Founders choose how to use them.

### **Not a Business Model**

Does not dictate pricing, packaging, or monetization strategy.

Helps founders discover what the market will pay for. Doesn't tell them what to charge.

---

## **Target Audience**

**Technical founders (3+ years experience)** who:

- Are stuck in perfectionist loops that prevent shipping
- Have failed 1-2x building products nobody wanted
- Waste time adding features before validating demand
- Need forcing function to validate first, build second
- Can edit config files and understand basic web development

**Core problem they face:**
"I keep building things nobody wants. I waste months on ideas I should kill in weeks. I know I need to validate but I don't know where to start and every tool makes it more complicated."

**What they need:**
A system that removes all excuses. Makes validation so simple there's no reason not to do it. Forces them to gather evidence before they build.

---

## **NOT For**

- Non-technical founders needing drag-and-drop builders
- Post-PMF companies already scaling validated products
- Anyone expecting passive validation without active marketing effort
- Founders who want the template to do the validation for them

Validation requires effort. This template removes technical barriers, not marketing effort.

---

## **Validation Paths Supported**

### **Path 1: Email Capture**
Visitor provides email in exchange for free value. Measures intent before content creation.

**Best for:** Courses, guides, frameworks, templates, methodologies

### **Path 2: Presales**
Visitor pays before product exists. Strongest signal of demand.

**Best for:** Digital products, cohort courses, software tools, premium content

### **Path 3: Service Bookings**
Visitor books paid consultation. Founder delivers service → learns pain points → systematizes → builds product.

**Best for:** Unclear PMF, need revenue while validating, domain expertise without product clarity

**Philosophy:** Service-to-product path bridges the gap between "no revenue" and "validated SaaS." Client feedback reveals what to build. Service delivery funds validation experiments.

---

## **Core Capabilities**

### **Landing Page Infrastructure**
Six conversion-optimized sections managed through YAML/Markdown. No design decisions required. Content focus only.




### **Event-Driven Analytics**
Pre-configured Umami integration. All behavioral data captured through event system. Swap providers without changing event code.

Comprehensive tracking: page views, interactions, conversions, funnels, drop-offs, traffic sources.

### **Webhook Delivery**
Signal captured → data streamed to external systems. No storage in template. No database required.

Send to Telegram, Slack, Discord, email, CRM, spreadsheet — wherever founders need their data.

### **Zero Dependencies**
Works out of the box. Deploy in 15 minutes. Start capturing signal immediately.

---

## **What We Deliberately Exclude**

### **Email Sequence Automation**
Assumes content exists before validation. Validation proves whether content is worth creating.

**Replaced with:** Transactional emails only. Capture → confirm → done.

### **Authentication & Gated Content**
Solves product problem, not validation problem. Tracking "who completed what" happens after validation.

**Philosophy:** Validation captures intent. Products deliver value. Don't mix them.

### **Payment Processing**
External links (Stripe, LemonSqueezy) prove payment intent without building checkout systems.

**Boundary:** Signal capture ≠ payment handling. Measure intent, don't process transactions.

### **Database Storage**
Webhook stream sufficient for validation. Storage decisions happen during product build.

**Exception:** May integrate NuxtHub if truly one-click and adds zero complexity.

---

## **Decision Framework**

Use this framework for every feature request, pull request, or product decision:

### **Step 1: Does this capture signal faster?**

**Yes →** Continue to Step 2  
**No →** Reject immediately

### **Step 2: Does this add a new validation path?**

**Yes →** Is it signal-based? Does it generate measurable evidence?  
**No →** Is this solving product problem instead of validation problem?

If product problem → Reject

### **Step 3: Can this be solved externally?**

**Yes →** Point to external tool, don't build it  
**No →** Why must it be in template? Prove necessity.

### **Step 4: Does this violate "best part is no part"?**

Could we achieve same outcome by removing something?  
Is this solving real problem or creating busywork?

### **Step 5: Does this align with core mission?**

**Core mission:** Help technical founders prove demand before building.

If feature doesn't serve this mission → Reject

---

## **Philosophy: Why This Matters**

### **Founders Fail Because They Build Too Early**

42% of startups fail building products nobody wants (CB Insights). Not because they built badly. Because they built before validating.

**This template exists to prevent that failure mode.**

### **Complexity Kills Validation**

Every additional feature adds cognitive load. Every configuration option creates decision paralysis. Every integration increases activation energy.

**Result:** Founders spend weeks configuring instead of capturing signal.

**Solution:** Ruthless simplicity. Remove everything that doesn't directly serve signal capture.

### **Validation Is Simple. We Made It Complicated.**

The question: "Do people want this?"

The answer: Measurable evidence (signups, bookings, payment intent).

Everything else — frameworks, dashboards, sequences — is theater disguised as progress.

**This template strips away the theater.**

---

## **Tone & Communication**

### **For System Prompt (Internal)**
- Philosophical and principled
- Focuses on "why" over "what"
- Establishes decision criteria
- Provides compass, not map

### **For Users (External)**
- Action-oriented and practical
- Evidence-driven, not prescriptive
- Empathetic to perfectionist struggles
- Ruthlessly focused on outcomes

### **For Decisions Log**
- Decision-focused, not feature-focused
- High-level philosophy over technical details
- Learning log over changelog
- "Why we cut" over "what we added"

---

## **Success Metrics**

### **Template Success**
- Time from clone → deployed and capturing signal (target: < 30 minutes)
- Percentage of clones that go live (target: > 60%)
- Number of confident validation decisions made (pivot or build)

### **Founder Success**
- Signal captured (signups, bookings, presales)
- Time saved not building unvalidated products
- Revenue generated through service-to-product path
- Evidence-based decisions made

**Core measure:** Are founders making better, faster decisions about what to build?

---

## **Future Considerations**

Only explore if they **accelerate signal capture** or **add new validation path**:

- **A/B testing** → Test multiple offers simultaneously
- **Hiring funnels** → Validate talent pipelines
- **QR code profiles** → Linktree-style for real-world lead capture
- **NuxtHub integration** → One-click database if truly seamless

**Will NOT add:**
- Email campaign builders (external tools exist)
- Onboarding flows (good copy is the onboarding)
- Advanced analytics dashboards (focus on signal, not dashboards)

---

## **Core Truth**

**The best validation system is the one founders actually use.**

Complexity kills usage.  
Simplicity wins.

Every feature we remove makes the template better.  
Every decision we make for founders reduces activation energy.  
Every constraint we enforce increases shipping velocity.

**Mission:** Help technical founders prove demand before building.

**Method:** Remove all excuses. Make validation so simple there's no reason not to do it.

**Outcome:** Fewer wasted builds. Faster learning loops. Better decisions about what to build next.

---

**This is our compass. Every decision must align with it.**