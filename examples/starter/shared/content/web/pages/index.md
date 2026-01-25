---
title: Your Product Name
description: One-sentence value proposition. What do you do for whom?
---

<!--
🚀 PROGRESSIVE VALIDATION TEMPLATE

Start minimal. Expand as you validate.

STAGE 1 (Always visible):
- Hero: Value prop + primary CTA
- Offer: What you're selling + conversion

STAGE 2 (Uncomment when driving traffic):
- Benefits: Why your solution matters
- Outcome: How it works, what they get

STAGE 3 (Uncomment when fielding questions):
- FAQ: Address objections and technical details

STAGE 4 (Uncomment when you have proof):
- Results: Testimonials and social proof
-->

<!-- ============================================ -->
<!-- STAGE 1: MINIMAL VALIDATION                 -->
<!-- ============================================ -->

::section-hero
---
badge:
  label: Open Source
  description: MIT Licensed
  to: https://github.com/yourusername/your-repo
  icon: i-simple-icons-github
intro:
  # Answer: What problem do you solve? For whom?
  # Example: "Ship Validated Products" not "Revolutionary Platform"
  title: Your Outcome-Focused Headline

  # What transformation do they get?
  # Example: "Start Validating" or "Launch Faster"
  highlight: Your Key Benefit

  # One sentence. What do they get? Why does it matter?
  description: >
    The core value proposition that makes someone care. Keep it under 25 words.
cta:
  primary:
    label: Get Started
    to: /offers/your-offer
media:
  src: /product/hero-screenshot.png
  alt: Screenshot showing your product's main value
# Optional: Add trust signals
metric:
  icon: i-lucide-trending-up
  label: Monthly Revenue
  value: "$12,038"
  delta: "+21%"
trusted:
  text: "Trusted by builders at 70+ startups"
  icons:
    - i-simple-icons-nuxtdotjs
    - i-simple-icons-tailwindcss
    - i-simple-icons-typescript
---
::



<!-- ============================================ -->
<!-- STAGE 2: DRIVING TRAFFIC                    -->
<!-- Uncomment when you need to explain WHY      -->
<!-- ============================================ -->

::section-benefits
---
title: The Problem Your Audience Has
description: Why does this problem matter? Quantify the pain if possible—"42% of startups fail because..." beats "This is a common problem."
headline: Optional Category Label
cta:
  headline: Ready to solve this?
  message: One sentence transitioning to your offer.
  label: See How It Works
  to: '#offer'
  icon: i-lucide-arrow-down
items:
  # Pick 3-6 benefits. Focus on OUTCOMES, not features.
  # Formula: [Outcome] so you can [Result]

  - id: benefit-1
    # Not: "Fast Performance"
    # Yes: "Ship in 30 Minutes"
    title: Specific outcome they get
    icon: i-lucide-zap
    # Why does this outcome matter? What does it enable?
    description: "The tactical benefit explained in 1-2 sentences. Focus on what changes for them."

  - id: benefit-2
    title: Another concrete outcome
    icon: i-lucide-shield
    description: "Why this matters to them specifically."

  - id: benefit-3
    title: Third outcome
    icon: i-lucide-target
    description: "The result they care about."

  - id: benefit-4
    title: Fourth outcome (optional)
    icon: i-lucide-split
    description: "Additional value they receive."

  - id: benefit-5
    title: Fifth outcome (optional)
    icon: i-lucide-scissors
    description: "What complexity gets removed."

  - id: benefit-6
    title: Sixth outcome (optional)
    icon: i-lucide-database-zap
    description: "Final key benefit."
---
::

::section-outcome
---
title: How This Actually Works
description: The bridge from awareness to action. Keep it simple.
steps:
  # Max 3 steps. Pattern: Action → Result

  - id: step-1
    title: 1. The First Action
    icon: i-lucide-download
    # What they actually do—be specific
    description: "What they do first. 'Run npm install' not 'Easy setup.'"
    result: Tangible output after step 1

  - id: step-2
    title: 2. The Core Action
    icon: i-lucide-edit
    description: "The main value-creating activity."
    result: What they achieve here

  - id: step-3
    title: 3. Go Live
    icon: i-lucide-rocket
    description: "The final step that delivers value."
    result: The end state they reach

features:
  # Supporting capabilities—what makes the steps above possible?
  # Pick 4-6. Be specific, not generic.

  - title: Core capability 1
    description: "What problem does this solve? How does it help complete the steps above?"
    icon: i-lucide-magnet

  - title: Key differentiator
    description: "Why is this better than alternatives? What's unique?"
    icon: i-lucide-trending-up

  - title: Time/effort saver
    description: "What does this eliminate? What does it automate?"
    icon: i-lucide-line-chart

  - title: Trust signal
    description: "What gives them confidence? Open source? Battle-tested?"
    icon: i-lucide-shield-check

  - title: Integration capability
    description: "What systems does this connect with?"
    icon: i-lucide-webhook

  - title: Developer experience
    description: "What makes this easy to use and customize?"
    icon: i-lucide-github
---
::

::section-offer
---
title: What You're Offering
description: The thing they get when they convert. Be specific about deliverables.
# Free? $49? "Launching Q2 2025"?
price: Free
cta:
  label: Get Started
  to: '#'
features:
  # What's included? Be concrete, not abstract.
  # Good: "Nuxt 4 + Tailwind starter"
  # Bad: "Modern tech stack"

  - title: Specific deliverable 1
    icon: statusAvailable

  - title: Specific deliverable 2
    icon: statusAvailable

  - title: Specific deliverable 3
    icon: statusAvailable

  # Use statusBeta for "coming soon" features
  - title: Future deliverable (coming soon)
    icon: statusBeta
---
::


<!-- ============================================ -->
<!-- STAGE 4: SOCIAL PROOF                       -->
<!-- Uncomment when you have testimonials/metrics -->
<!-- ============================================ -->

::section-results
---
title: Results from Real Users
description: What happens when people actually use this.
items:
  # Real testimonials > fake ones
  # If you don't have testimonials yet, DELETE this section

  - quote: "Specific outcome they achieved. 'Saved me 40 hours' beats 'This is great!'"
    name: Real Person Name
    role: Their title or credibility marker
    avatarUrl: /testimonials/person-1.jpg
    link: https://twitter.com/theirhandle
    highlight: false

  # Highlight your strongest testimonial
  - quote: "Your best result. Make this one count."
    name: Another Real Person
    role: Why we should trust them
    avatarUrl: /testimonials/person-2.jpg
    link: null
    highlight: true

  - quote: "Third testimonial for credibility."
    name: Third Person
    role: Their context
    avatarUrl: /testimonials/person-3.jpg
    link: null
    highlight: false
---
::


<!-- ============================================ -->
<!-- STAGE 3: ANSWERING OBJECTIONS              -->
<!-- Uncomment when you have common questions    -->
<!-- ============================================ -->

::section-faq
---
title: Common Questions
description: Answers to help you decide if this is right for you.
cta:
  headline: Still have questions?
  message: Check the docs or ask the community.
  label: View Documentation
  to: https://docs.yourproduct.com
  icon: i-lucide-book-open
---
::
