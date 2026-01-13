# Dark Sky Maharashtra Documentation

Authority documentation system demonstrating the Founder Funnel docs feature.

## Quick Start

```bash
pnpm install
pnpm dev
```

Visit http://localhost:3000

## Key Features

### 1. Auto-Discovering References

Write inline citations that automatically collect and render at page bottom:

```markdown
MPCB guidelines:reference{id="mpcb-2024" source="MPCB Guidelines" url="/sources/mpcb.pdf" credibility="government"}.
```

### 2. Smart Cross-Linking

- **Auto-tracked links** — All `[text](/path)` links tracked automatically
- **Bidirectional references** — See which pages link to current page
- **Related content** — Auto-discovered by tags, categories, links
- **Visual indicators** — Different icons for policy/research/implementation links

### 3. MCP Resources

Source PDFs exposed to AI tools via `/api/mcp` endpoint.

### 4. Sources Tracking

Visit `/sources` for verification status of all source documents.

## Content Structure

```
content/
├── 1.policy/          # Government policies, regulations
├── 2.research/        # Scientific studies, data
└── 3.implementation/  # Practical guides
```

## Adding Content

Create new page:
```bash
touch content/2.research/new-study.md
```

With frontmatter:
```yaml
---
title: Study Title
category: research
tags: [astronomy, data]
related: [/policy/guidelines]
---
```

Add inline references:
```markdown
Study findings:reference{id="study-2024" source="Study Name" url="/sources/study.pdf" credibility="academic"}.
```

## Components

- `Reference` — Inline citation
- `References` — Auto-rendered list
- `RelatedContent` — Related pages
- `BackLinks` — Pages linking here
- `SmartLink` — Visual link indicators
- `SourcesTable` — All sources

## Learn More

- [Nuxt Content Docs](https://content.nuxt.com/)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Founder Funnel](https://github.com/incubrain/founder-funnel)
