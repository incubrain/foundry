# Glossary — incubrain/foundry

| Term | Aliases | Meaning |
|------|---------|---------|
| Foundry | @incubrain/foundry, content-framework | Nuxt 4 validation layer that wraps a site and streams the full signal of whether it's working — email capture, presales, bookings, errors — so founders prove demand before building product. |
| Incubrain | platform | AI-accessibility platform for Marathi OCR and government document digitization using Foundry. |
| Nuxt | nuxt, vue-framework | Vue 3 meta-framework for SSR and content-driven applications; Foundry's runtime. |
| Nuxt Content | content-collection, cms | Content collection system for managing structured Markdown and YAML as queryable data. |
| Nuxt Studio | studio, headless-cms | Git-backed CMS for live editing Nuxt Content; enables non-developers to modify foundry sites. |
| Schema | validation-schema, type-definition | Declarative specification for content collections; enforces structure and types on pages, faq, team, docs. |
| Composable | hook, reusable-logic | Vue composable function providing reactive data and utilities (e.g., useScrollReveal, useContent). |
| SSR | server-side-rendering | Rendering mode: components execute on server, HTML sent to browser; improves SEO and performance. |
| CSR | client-side-rendering | Rendering mode: components execute in browser after initial HTML load; slower for SEO. |
| SEO | search-engine-optimization | Techniques for making sites discoverable via search engines; native Foundry concern. |
| CLS | cumulative-layout-shift | Web Vital: measure of visual stability during page load; Foundry-relevant performance metric. |
| Configuration | config, settings | `nuxt.config.ts`, `app.config.ts`, `content.config.ts`; application and content behavior. |
| Validation Path | validation-route, check | Procedural steps for validating configuration, content schemas, or deployment readiness. |
| Documentation | docs, reference | Markdown guides and examples for using Foundry in a Nuxt 4 project. |
| MCP | tool-integration, model-context-protocol | Tools exposing Foundry capabilities to Claude for AI-assisted site building. |
| Verdaccio | local registry, publish:local | Local private npm registry used to publish `@incubrain/foundry` prerelease builds so external consumer repos (astronera, incubrain) can test layer changes without a real npm release. |
| Site Event | signal row, signal event, event row | One first-party row Foundry records about its own site (email capture, presale, booking, error, page view, scroll depth) into the durable buffer Polaris pulls. Code type is still `SignalRow`. Not a Polaris *signal* — that term is Polaris's closed four-state set. |
| Probe | uptime check, ping, health check | An outside check Polaris makes against a site's **public** URL: uptime, site-identity assertion (`/api/_health` `siteId` must match the registry), domain expiry (RDAP), SSL expiry. A site can never record its own Probes — a parked or expired domain never reaches Foundry. |
