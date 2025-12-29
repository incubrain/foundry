---
title: Your Product Name
description: One-sentence value proposition. What do you do for whom?
---

<!-- 
  🚀 PROGRESSIVE VALIDATION TEMPLATE
  
  Start minimal. Expand as you validate.
  
  STAGE 1 (Always visible):
    - Hero: Value prop + primary CTA
    - Product: What you're offering + email capture
  
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
data:
  badge:
    title: Open Source
    description: MIT Licensed
    to: https://github.com/yourusername/your-repo
  intro:
    # Answer: What problem do you solve? For whom?
    # Example: "Ship Validated Products" not "Revolutionary Platform"
    title: Your Outcome-Focused Headline
    
    # One sentence. What do they get? Why does it matter?
    # Example: "Help technical founders validate before building—so they don't waste months on products nobody wants."
    description: The core value proposition that makes someone care.
  
  media:
    # Start with 'image', switch to 'video' when you have one
    type: image
    src: /product/hero-screenshot.png
    alt: Screenshot showing your product's main value
---
::

::section-offer
---
data:
  intro:
    # What are they signing up for?
    title: What You're Offering
    
    # Be specific: "Email course" vs "Resources", "Template" vs "Solution"
    description: The thing they get when they give you their email.
  
  # Free? $49? "Launching Q2 2025"?
  price: Free
  
  features:
    # What's included? Be concrete, not abstract.
    # Good: "Nuxt 4 + Tailwind starter"
    # Bad: "Modern tech stack"
    
    - title: Specific deliverable 1
      icon: status-available
    
    - title: Specific deliverable 2
      icon: status-available
    
    - title: Specific deliverable 3
      icon: status-available
    
    # Use status-beta for "coming soon" features
    - title: Future deliverable
      icon: status-beta
---
::

<!-- ============================================ -->
<!-- STAGE 2: DRIVING TRAFFIC                    -->
<!-- Uncomment when you need to explain WHY      -->
<!-- ============================================ -->

<!-- 
::section-benefits
---
data:
  intro:
    # The pain point your audience feels daily
    title: The Problem Your Audience Has
    
    # Why does this problem matter? What's at stake?
    description: Quantify the pain if possible—"42% of startups fail because..." beats "This is a common problem."
  
  cta:
    headline: Ready to solve this?
    message: One sentence transitioning to your offer.
    button:
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
      description: The tactical benefit explained in 1-2 sentences. Focus on what changes for them.
    
    - id: benefit-2
      title: Another concrete outcome
      icon: i-lucide-shield
      description: Why this matters to them specifically.
    
    - id: benefit-3
      title: Third outcome
      icon: i-lucide-target
      description: The result they care about.
---
::
-->

<!-- 
::section-outcome
---
data:
  intro:
    # What's the journey from "I need this" to "I'm using it"?
    title: How This Actually Works
    description: The bridge from awareness to action.
  
  steps:
    # Max 3 steps. Keep it simple.
    # Pattern: Action → Result
    
    - id: step-1
      # What do they do first?
      title: 1. The First Action
      icon: i-lucide-download
      # How long? How hard? Be honest.
      description: What they actually do—be specific. "Run npm install" not "Easy setup."
      # What do they have after this step?
      result: Tangible output after step 1
    
    - id: step-2
      title: 2. The Core Action
      icon: i-lucide-edit
      description: The main value-creating activity.
      result: What they achieve here
    
    - id: step-3
      title: 3. Go Live
      icon: i-lucide-rocket
      description: The final step that delivers value.
      result: The end state they reach
  
  features:
    # Supporting capabilities—what makes the steps above possible?
    # Pick 4-6. Be specific, not generic.
    
    - title: Core capability 1
      description: What problem does this solve? How does it help complete the steps above?
      icon: i-lucide-zap
    
    - title: Key differentiator
      description: Why is this better than alternatives? What's unique?
      icon: i-lucide-star
    
    - title: Time/effort saver
      description: What does this eliminate? What does it automate?
      icon: i-lucide-clock
    
    - title: Trust signal
      description: What gives them confidence? Open source? Battle-tested? Used by X companies?
      icon: i-lucide-shield-check
---
::
-->

<!-- ============================================ -->
<!-- STAGE 3: ANSWERING OBJECTIONS              -->
<!-- Uncomment when you have common questions    -->
<!-- ============================================ -->

<!-- 
::section-faq
---
data:
  intro:
    title: Common Questions
    # Why should they read this section?
    description: Answers to help you decide if this is right for you.
  
  cta:
    headline: Still have questions?
    message: Check the docs or ask the community.
    button:
      label: View Documentation
      to: https://docs.yourproduct.com
      icon: i-lucide-book-open
---
:: 
-->


<!-- ============================================ -->
<!-- STAGE 4: SOCIAL PROOF                       -->
<!-- Uncomment when you have testimonials/metrics -->
<!-- ============================================ -->

<!-- 
::section-results
---
data:
  intro:
    title: Results from Real Users
    description: What happens when people actually use this.
  
  items:
    # Real testimonials > fake ones
    # If you don't have testimonials yet, DELETE this section
    
    - quote: Specific outcome they achieved. "Saved me 40 hours" beats "This is great!"
      name: Real Person Name
      role: Their title or credibility marker
      avatarUrl: /testimonials/person-1.jpg
      link: https://twitter.com/theirhandle
      highlight: false
    
    # Highlight your strongest testimonial
    - quote: Your best result. Make this one count.
      name: Another Real Person
      role: Why we should trust them
      avatarUrl: /testimonials/person-2.jpg
      link: null
      highlight: true
    
    - quote: Third testimonial for credibility.
      name: Third Person
      role: Their context
      avatarUrl: /testimonials/person-3.jpg
      link: null
      highlight: false
---
::
-->