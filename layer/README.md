# @incubrain/foundry

A Nuxt layer for building validation landing pages and authority documentation sites.

## Installation

```bash
npm install @incubrain/foundry
```

Add to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  extends: ['@incubrain/foundry']
})
```

## Features

- **Landing Pages** — Section-driven pages with signal capture (email, presales, bookings)
- **Documentation** — Authority docs with citations, cross-linking, and MCP integration
- **Event Tracking** — Analytics-agnostic event system with webhook streaming
- **Nuxt Content** — Markdown-first content with MDC component support
- **Nuxt UI** — Pre-styled components with Tailwind v4

## Quick Start

```bash
# Create a new project
npx create-foundry my-project
cd my-project
npm install
npm run dev
```

## Requirements

- Nuxt 4.x
- Node.js 22+

## Documentation

Full documentation: [foundry.incubrain.org](https://foundry.incubrain.org)

## License

MIT
