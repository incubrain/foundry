---
title: Your Product Name
description: One-sentence value proposition. What do you do for whom?
---

<!--
PROGRESSIVE VALIDATION TEMPLATE

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
---
::



<!-- ============================================ -->
<!-- STAGE 2: DRIVING TRAFFIC                    -->
<!-- Uncomment when you need to explain WHY      -->
<!-- ============================================ -->

::section-benefits
---
title: The Problem Your Audience Has
description: Why does this problem matter? Quantify the pain if possible.
headline: Optional Category Label
cta:
  headline: Ready to solve this?
  message: One sentence transitioning to your offer.
  label: See How It Works
  to: '#offer'
  icon: i-lucide-arrow-down
items:
  # Pick 3-6 benefits. Focus on OUTCOMES, not features.
  - id: benefit-1
    title: Specific outcome they get
    icon: i-lucide-zap
    description: "The tactical benefit explained in 1-2 sentences."

  - id: benefit-2
    title: Another concrete outcome
    icon: i-lucide-shield
    description: "Why this matters to them specifically."

  - id: benefit-3
    title: Third outcome
    icon: i-lucide-target
    description: "The result they care about."
---
::

::section-outcome
---
title: How This Actually Works
description: The bridge from awareness to action. Keep it simple.
steps:
  - id: step-1
    title: 1. The First Action
    icon: i-lucide-download
    description: "What they do first. Be specific."
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
  - title: Core capability 1
    description: "What problem does this solve?"
    icon: i-lucide-magnet

  - title: Key differentiator
    description: "Why is this better than alternatives?"
    icon: i-lucide-trending-up

  - title: Time/effort saver
    description: "What does this eliminate or automate?"
    icon: i-lucide-line-chart

  - title: Trust signal
    description: "What gives them confidence?"
    icon: i-lucide-shield-check
---
::

::section-offer
---
title: What You're Offering
description: The thing they get when they convert. Be specific about deliverables.
price: Free
cta:
  label: Get Started
  to: '#'
features:
  - title: Specific deliverable 1
    icon: statusAvailable

  - title: Specific deliverable 2
    icon: statusAvailable

  - title: Specific deliverable 3
    icon: statusAvailable

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
  - quote: "Specific outcome they achieved."
    name: Real Person Name
    role: Their title or credibility marker
    avatarUrl: /testimonials/person-1.jpg
    link: https://twitter.com/theirhandle
    highlight: false

  - quote: "Your best result. Make this one count."
    name: Another Real Person
    role: Why we should trust them
    avatarUrl: /testimonials/person-2.jpg
    link: null
    highlight: true
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
