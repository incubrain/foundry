# Changelog

All notable changes to this project will be documented in this file.

## [0.5.1] - Unreleased

### Fixed

- Citations handle missing IDs gracefully
- Internal linking no longer incorrectly prefixes docs path to page links
- `useCitations` reactivity with computed get/set state
- Page data loads correctly based on layout
- `SectionWrapper` forwards slots with scope for Nuxt Studio UI detection
- `addServerHandler` requires explicit method
- Rename `ProseCite|ProseDfn` to `Cited|Defn` (Nuxt Studio inline prose workaround)

### Changed

- Replace heroicons with Lucide icons
- Bump Nuxt to 4.3.0
- Bump Nuxt Studio to 1.2.0
- Add "Built with @incubrain/foundry" to footer

## [0.5.0] - 2025-01

First npm release as `@incubrain/foundry`.

### Added

- **npm package** — Install via `npm install @incubrain/foundry`
- **CLI** — `npx create-foundry` scaffolds new projects
- **Authority docs** — Citations, cross-linking, bibliography, MCP integration
- **ProseCite/ProseDfn** — Inline citation and term definition components
- **PageHeroWrapper/PageSplit** — Better MDC syntax support and layout flexibility
- **UCarousel slots** — Slot support using `cloneVNode` and `useSlots`
- **Dynamic navigation** — Auto-generated from content pages
- **Content collections** — Extensible via `zod.merge()`
- **Nuxt LLMs** — Better LLM discovery for docs
- **RSS feeds** — Dynamic generation with collection handlers

### Changed

- Rebrand from "Founder Funnel" to "Foundry"
- Fork docus, remove i18n and feature bloat
- Restructure repo for npm publish (layer/, examples/, cli/)
- Move layer deps from root to layer/package.json
- Reduce bundle size by 10MB (remove default icons, lazy-load KaTeX)
- Simplify events system
- Consolidate layouts from 6 to 4
- Content-driven website using Nuxt Content catchall pages

### Fixed

- Citations and bibliography rendering
- HMR issues with vibekanban branches
- Prettier pnpm workspace resolution
- Dockerfile copying correct directories

### Removed

- Dependabot (more noise than value)
- One-click deploy (replaced with repo-sync)
- QR code function (use dub.co instead)
- Team collection complexity
