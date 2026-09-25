---
title: Foundry — Signal Station
description: A Nuxt 4 layer that wraps your website in a recording instrument — every visit, capture, and error, human or machine, streamed raw to where you decide to double down or kill.
hero: true
navigation: false
---

::section-station
---
events:
  - at: 0.14
    date: 2026-05
    label: agents pass humans
    amp: 0.9
  - at: 0.38
    date: 2026-08-20
    label: signal transport ships
    amp: 0.6
  - at: 0.56
    date: 2026-08-31
    label: v0.8.0 on npm
    amp: 0.75
  - at: 0.78
    date: now
    label: your visit, on the drum
    amp: 0.45
github: https://github.com/incubrain/foundry
headline: The next billion visitors won't be human.
pkg: "@incubrain/foundry"
sub: "Agents passed human traffic on Cloudflare's network in May 2026. Foundry
  wraps your Nuxt site in an instrument that records every signal — human or
  machine — and streams it raw to where you decide: double down, or kill."
---
::

::section-reading
---
stats:
  - value: MAY 2026
    claim: Agents surpass human activity on Cloudflare's network — a year early.
    source:
      label: Cloudflare Q2 2026 earnings call
      href: https://www.fool.com/investing/2026/08/16/cloudflare-ceo-says-the-internet-is-changing-exponentially/
  - value: ~18×
    claim: Agent-traffic growth in the preceding twelve months.
    source:
      label: Motley Fool, Aug 2026
      href: https://www.fool.com/investing/2026/08/16/cloudflare-ceo-says-the-internet-is-changing-exponentially/
  - value: 1,000×
    claim: Cloudflare's five-year projection vs human traffic — marked as projection
      on the chart.
    source:
      label: via Stocktwits / Yahoo Finance
      href: https://finance.yahoo.com/technology/ai/articles/elon-musk-backs-study-showing-032931794.html
body: Not a forecast — a measurement. The crossover already happened, ahead of
  schedule. Sites designed only for human eyes are now illegible to most of
  their readers.
plate: FIG. 1 — THE READING
title: The web's readership just changed species.
---
::

::section-loop
---
steps:
  - n: "01"
    name: Wrap
    detail: One line, and your site is an instrument.
    code: "extends: ['@incubrain/foundry']"
  - n: "02"
    name: Stream
    detail: Every event inked to a durable buffer you own — 14 days on disk,
      nothing pushed, everything pulled, even if nobody's watching yet.
    code: GET /api/_signals/export
  - n: "03"
    name: Decide
    detail: "Read the record, make the only call that matters: double down, or kill."
plate: PLATE II — THE LOOP
title: Wrap. Stream. Decide.
---
::

::section-channels
---
channels:
  - ch: CH 01
    name: Captures
    detail: Email, presales, bookings — demand lands as signal rows, not inbox noise.
  - ch: CH 02
    name: Events
    detail: Section views, offer clicks, outbound links, and file downloads —
      which promise pulled, which one died.
  - ch: CH 03
    name: Errors
    detail: Server and client failures, plus 404s that catch a dead campaign
      link — same stream, a broken site is the loudest signal.
  - ch: CH 04
    name: Visitors
    detail: Every row stamped human, agent, or bot, plus device, browser, and OS
      — a daily-salted hash counts visitors with no cookies, no consent
      banner, EU-compliant by design.
endpoints:
  - path: /api/_signals/export
    note: bearer · pull
  - path: /api/_signals/ingest
    note: client rows
  - path: /api/v1/webhook
    note: form capture
  - path: /api/_health
    note: liveness · 0.8.1
  - path: /mcp
    note: list-pages · get-page · what-changed
  - path: /sitemap.xml
    note: page manifest
  - path: /llms.txt
    note: agent map
  - path: /robots.txt
    note: crawler policy
body: No dashboards, no on-site analytics — interpretation belongs to the
  consumer. Four channels, one durable buffer (14 days on disk), one
  authenticated export. On our own sites, that export already feeds an
  internal operator surface — it catches a hijacked or expired domain even
  when the page still returns 200, warns before a certificate lapses, and
  reads per-site views, funnels, and real-time traffic.
plate: PLATE III — CHANNELS
title: One drum, every signal.
---
::

:section-live{body="Not a mockup — the real emit hook. Every scroll and click becomes a signal row, mirrored here the instant your browser sends it. Reading the record is itself recorded." plate="PLATE IV — THE LIVE TAIL" title="Watch this page record you."}

::section-species
---
items:
  - name: Server-rendered everything
    detail: Fully legible to zero-JS crawlers — GPTBot, ClaudeBot, PerplexityBot.
      This page included.
    status: SHIPPED
  - name: Visitor classification
    detail: Every row stamped human | agent | bot — agent traffic measured, not
      guessed.
    status: SHIPPED
  - name: MCP tools on every site
    detail: Agents query content and detect changes by hash instead of scraping.
    status: SHIPPED
  - name: sitemap.xml · robots.txt · llms.txt
    detail: The discovery surfaces, emitted by default.
    status: SHIPPED
  - name: Deliberate AI-crawler robots policy
    detail: Training crawlers and live-fetch bots treated separately, per site.
    status: PLANNED
  - name: Raw markdown negotiation
    detail: Plain markdown for agents that ask, on any host.
    status: PLANNED
  - name: FAQ & Organization structured data
    detail: JSON-LD from content the sites already model.
    status: PLANNED
body: Agents don't run your JavaScript — they read structure, or they leave.
  Machine readers are a first-class audience here, and the shipped-vs-planned
  ledger stays honest.
plate: PLATE V — BOTH SPECIES
title: Built to be read by machines, watched by you.
---
::

::section-ledger
---
entries:
  - date: 2026-05
    entry: Agent traffic passes human activity on Cloudflare's network.
    status: REPORTED
  - date: 2026-08-20
    entry: Signal transport ships — ring buffer, error hook, authenticated export.
    status: RECORDED
  - date: 2026-08-31
    entry: v0.8.0 published to npm. Two production sites streaming — astronera.org
      and incubrain.org.
    status: RECORDED
  - date: 2026-09-25
    entry: Site Events move onto a durable volume — 14-day retention, cookieless
      visitor hashing, outbound/download/404 tracking, device and browser
      stamps.
    status: RECORDED
  - date: 2026-09-25
    entry: The internal operator surface reading this export adds site-identity
      checks, domain/SSL-expiry warnings, and per-site analytics with funnels
      and a real-time view.
    status: RECORDED
  - date: —
    entry: Third-party adoption beyond our own sites.
    status: OPEN
  - date: —
    entry: The 1,000× projection.
    status: OPEN
quote:
  text: Most of this is not proven yet.
  source: VISION.md, this repository
note: "This page is itself a Foundry instrument — your visit is on the drum
  right now. No adoption numbers, no testimonials: when the record says
  something, the record will say it."
plate: PLATE VI — STATION LOG
title: A live experiment, honestly framed.
---
::

:section-questions{plate="PLATE VII — QUESTIONS" title="Asked and answered."}

::section-tag
---
agents:
  - path: /llms.txt
    note: what this site offers
  - path: /sitemap.xml
    note: every page
  - path: /mcp
    note: query content · detect changes
  - path: /api/_health
    note: am I up (from 0.8.1)
colophon: "FOUNDRY · SIGNAL STATION №1 — built on itself: this page records its
  own signal, classifies its own visitors, and exports its own record. Nuxt 4 ·
  Tailwind 4 · TypeScript."
github: https://github.com/incubrain/foundry
headline: Point an instrument at your next idea.
pkg: "@incubrain/foundry"
---
::
