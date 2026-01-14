# 🎯 Authority Documentation Platform — Revised Implementation Plan

## Executive Overview

**Adding Docus-based documentation to Founder Funnel for domain authority positioning, focused on Dark Sky Conservation in Maharashtra as proof of concept.**

### Core Features
1. **Auto-discovering citation system** — Write `:reference{}` inline, references auto-collect and render at bottom
2. **MCP Resources integration** — Upload PDFs/documents, expose to AI tools automatically
3. **Sources tracking page** — Single table showing all source documents, verification dates
4. **Dark Sky Maharashtra case study** — Proof of concept with real-world authority content

### Strategic Value
- **Authority moat** — Properly cited content is hard to replicate
- **AI-ready** — MCP server + resources enable LLM access to sources
- **Credibility signals** — Government/academic sources build trust
- **Template differentiation** — No other validation template offers this

---

## 🔧 Technical Architecture

### 1. Auto-Discovering References System

  **Problem solved:** No manual reference listing, automatic collection from inline citations.

  **Implementation via Nuxt Content Transformer:**

```ts
// docs/transformers/references.ts
import { defineTransformer } from '@nuxt/content'

export default defineTransformer({
  name: 'auto-references',
  extensions: ['.md'],
  transform(file) {
    // Regex to find all :reference{} components
    const referencePattern = /:reference\{([^}]+)\}/g
    const references: Reference[] = []
    const seen = new Set<string>()

    let match
    while ((match = referencePattern.exec(file.body)) !== null) {
      const propsString = match[1]
      const props = parsePropsString(propsString)

      // Only add unique references (by id)
      if (props.id && !seen.has(props.id)) {
        references.push({
          id: props.id,
          source: props.source,
          url: props.url,
          credibility: props.credibility,
          date: props.date,
          author: props.author,
          description: props.description,
        })
        seen.add(props.id)
      }
    }

    return {
      ...file,
      references, // Add to file metadata
    }
  },
})

function parsePropsString(str: string): Record<string, string> {
  const props: Record<string, string> = {}
  const propPattern = /(\w+)="([^"]+)"/g
  let match

  while ((match = propPattern.exec(str)) !== null) {
    props[match[1]] = match[2]
  }

  return props
}

interface Reference {
  id: string
  source: string
  url?: string
  credibility?: string
  date?: string
  author?: string
  description?: string
}
```

  **Register in content schema:**

```ts
// docs/content.config.ts
import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: '**/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        references: z.array(z.object({
          id: z.string(),
          source: z.string(),
          url: z.string().optional(),
          credibility: z.enum(['government', 'academic', 'media', 'ngo']).optional(),
          date: z.string().optional(),
          author: z.string().optional(),
          description: z.string().optional(),
        })).optional(),
      }),
    }),
  },
})
```

  **Auto-render in layout:**

```vue
<!-- docs/app/layouts/docs.vue -->
<script setup lang="ts">
const route = useRoute()
const { data: page } = await useAsyncData(`page-${route.path}`, () =>
  queryCollection('content').path(route.path).first()
)
</script>

<template>
  <div>
    <!-- Page content -->
    <ContentRenderer :value="page" />

    <!-- Auto-rendered references (if any exist) -->
    <References
      v-if="page?.references?.length"
      :refs="page.references"
    />
  </div>
</template>
```

  **Result:** Write inline citations, references auto-appear at bottom. Zero manual work.

---

### 2. MCP Resources for Source Documents

**Expose PDFs/documents as MCP resources so AI tools can access them.**

```ts
// docs/server/mcp/resources/mpcb-guidelines.ts
export default defineMcpResource({
  file: 'sources/mpcb-light-pollution-guidelines-2024.pdf',
  metadata: {
    description: 'Maharashtra Pollution Control Board - Light Pollution Guidelines (2024)',
    mimeType: 'application/pdf',
    credibility: 'government',
    lastVerified: '2026-01-12',
  },
})
```

```ts
// docs/server/mcp/resources/lonar-study.ts
export default defineMcpResource({
  file: 'sources/lonar-crater-astronomical-assessment.pdf',
  metadata: {
    description: 'Indian Institute of Astrophysics - Lonar Crater Sky Quality Study',
    mimeType: 'application/pdf',
    credibility: 'academic',
    lastVerified: '2026-01-12',
  },
})
```

**Directory structure:**

```bash
docs/
├── public/
│   └── sources/          # Source PDFs (publicly accessible)
│       ├── mpcb-light-pollution-guidelines-2024.pdf
│       ├── lonar-crater-astronomical-assessment.pdf
│       └── dark-sky-international-criteria.pdf
└── server/
    └── mcp/
        └── resources/    # MCP resource definitions
            ├── mpcb-guidelines.ts
            ├── lonar-study.ts
            └── dsi-criteria.ts
```

**MCP exposes these automatically:**
- AI tools can list available source documents
- AI tools can retrieve document content
- Links to sources from citations work

---

### 3. Sources Tracking Page

  **Single page listing all source documents with verification status.**

```markdown
<!-- docs/content/sources.md -->
---
title: Source Documents
description: All source materials used in this documentation
navigation: true
---

# Source Documents

This documentation is built from the following verified sources. All documents are available to AI tools via our MCP server.

::sources-table
::
```

```vue
<!-- docs/components/content/SourcesTable.vue -->
<script setup lang="ts">
// Query all MCP resources
const { data: resources } = await useFetch('/mcp/resources/list')

interface SourceRow {
  name: string
  credibility: string
  lastVerified: string
  description: string
  url: string
}

const sources = computed<SourceRow[]>(() => {
  if (!resources.value?.resources) return []

  return resources.value.resources.map(r => ({
    name: r.name,
    credibility: r.metadata.credibility || 'unknown',
    lastVerified: r.metadata.lastVerified || 'Not verified',
    description: r.metadata.description || '',
    url: r.uri || '#',
  }))
})

const credibilityColor = {
  government: 'primary',
  academic: 'info',
  media: 'neutral',
  ngo: 'secondary',
  unknown: 'neutral',
}
</script>

<template>
  <div class="my-8">
    <UTable
      :rows="sources"
      :columns="[
        { key: 'name', label: 'Document' },
        { key: 'credibility', label: 'Type' },
        { key: 'lastVerified', label: 'Last Verified' },
        { key: 'description', label: 'Description' },
      ]"
    >
      <template #name-data="{ row }">
        <a
          :href="row.url"
          target="_blank"
          class="text-primary hover:underline inline-flex items-center gap-1"
        >
          {{ row.name }}
          <UIcon name="i-lucide-external-link" class="w-3 h-3" />
        </a>
      </template>

      <template #credibility-data="{ row }">
        <UBadge
          :label="row.credibility"
          :color="credibilityColor[row.credibility]"
          variant="soft"
          size="xs"
        />
      </template>

      <template #lastVerified-data="{ row }">
        <span class="text-sm text-muted">
          {{ row.lastVerified }}
        </span>
      </template>
    </UTable>

    <div class="mt-6 text-sm text-muted">
      <p>
        <strong>Verification Policy:</strong> Sources are manually verified quarterly.
        Last comprehensive review: January 2026.
      </p>
      <p class="mt-2">
        <strong>AI Access:</strong> All sources are available to AI tools via our
        <a href="/mcp" class="text-primary hover:underline">MCP server</a>.
      </p>
    </div>
  </div>
</template>
```

  **Features:**
  - Lists all source documents
  - Shows credibility type (government/academic/etc)
  - Displays last verification date
  - Links to actual documents
  - Notes AI accessibility via MCP

---

## 📋 Implementation Tasks

### Task 1: Docus Setup

**Create `/docs` directory:**
```bash
npx create-docus docs
cd docs
pnpm install
```

**Configure for Dark Sky Maharashtra:**
```ts
// docs/app.config.ts
export default defineAppConfig({
  docus: {
    locale: 'en',
  },
  seo: {
    title: 'Dark Sky Conservation — Maharashtra',
    description: 'Authoritative resource on light pollution policy and dark sky preservation in Maharashtra, India',
  },
  header: {
    title: 'Dark Sky Maharashtra',
  },
  github: {
    url: 'https://github.com/incubrain/dark-sky-docs',
    branch: 'main',
    rootDir: 'docs',
  },
})
```

```ts
// docs/nuxt.config.ts
export default defineNuxtConfig({
  extends: ['docus'],

  content: {
    build: {
      transformers: [
        '~/transformers/references',
      ],
    },
  },

  llms: {
    domain: 'https://darksky-maharashtra.example.com',
    title: 'Dark Sky Conservation — Maharashtra',
    description: 'Comprehensive guide to light pollution policy and dark sky preservation',
    sections: [
      {
        title: 'Policy Framework',
        description: 'Government policies and regulations',
        contentCollection: 'content',
        contentFilters: [
          { field: 'path', operator: 'LIKE', value: '/policy/%' }
        ],
      },
      {
        title: 'Research & Data',
        description: 'Scientific studies and measurements',
        contentCollection: 'content',
        contentFilters: [
          { field: 'path', operator: 'LIKE', value: '/research/%' }
        ],
      },
    ],
    notes: [
      'All claims cited with government or academic sources',
      'Content reviewed by domain experts',
      'Focus on Maharashtra, India',
    ],
  },

  mcp: {
    enabled: true,
  },
})
```

---

### Task 2: Auto-Reference System

  **Create transformer:**
```bash
mkdir -p docs/transformers
```

  Copy the `references.ts` transformer code from above.

  **Update content schema:**

  Copy the `content.config.ts` with references schema.

  **Create inline Reference component:**

```vue
<!-- docs/components/content/Reference.vue -->
<script setup lang="ts">
interface Props {
  id: string
  source: string
  url?: string
  credibility?: 'government' | 'academic' | 'media' | 'ngo'
  date?: string
  author?: string
  description?: string
}

defineProps<Props>()

// Generate reference number (will be handled by References component)
// This is just the inline superscript
</script>

<template>
  <sup class="reference-link">
    <a
      :href="`#ref-${id}`"
      class="text-primary hover:underline font-mono"
      :title="source"
    >
      [{{ id }}]
    </a>
  </sup>
</template>

<style scoped>
.reference-link {
  font-size: 0.75em;
  margin-left: 0.15em;
}
</style>
```

  **Create References list component** (from earlier, with auto-numbering).

  **Create custom docs layout:**

  Copy the `docs.vue` layout from above that auto-renders references.

---

### Task 3: MCP Resources Setup

**Create sources directory:**
```bash
mkdir -p docs/public/sources
```

**Add sample PDFs** (get real documents):
- MPCB guidelines PDF
- Lonar crater study PDF
- Dark Sky International criteria PDF

**Create MCP resource definitions:**
```bash
mkdir -p docs/server/mcp/resources
```

Create one `.ts` file per source document (examples above).

**Test MCP resources:**
```bash
pnpm dev
curl http://localhost:3000/mcp

# Should list resources including source PDFs
```

---

### Task 4: Sample Content Structure

```bash
docs/content/
├── index.md                          # Landing
├── sources.md                        # Sources table
├── 1.policy/
│   ├── index.md
│   ├── maharashtra-guidelines.md    # MPCB policy
│   └── enforcement.md                # Implementation status
├── 2.research/
│   ├── index.md
│   ├── lonar-crater.md              # Case study
│   └── sky-quality-data.md          # Measurements
└── 3.implementation/
    ├── index.md
    ├── municipal-lighting.md         # Local ordinances
    └── community-education.md        # Outreach programs
```

  **Write 3-5 articles using inline references:**

Example:
```markdown
<!-- docs/content/policy/maharashtra-guidelines.md -->
---
title: Maharashtra Light Pollution Guidelines
description: State-level policy framework for dark sky preservation
---

# Maharashtra Light Pollution Guidelines

The Maharashtra Pollution Control Board (MPCB) established guidelines in 2024:reference{id="mpcb-2024" source="MPCB Light Pollution Guidelines" url="/sources/mpcb-light-pollution-guidelines-2024.pdf" credibility="government" date="2024-01" author="MPCB"}.

## Protected Areas

Twelve critical zones identified:reference{id="expert-committee" source="Expert Committee Report on Dark Sky Zones" credibility="academic" author="Dr. Arvind Paranjpye, IUCAA" date="2023-11"}, focusing on:

1. Lonar Crater region (primary)
2. Rural observatory sites
3. Ecologically sensitive areas

<!-- References auto-render at bottom via transformer + layout -->
```

---

### Task 5: Sources Page Implementation

**Create sources page:**
```markdown
<!-- docs/content/sources.md -->
---
title: Source Documents
description: Verified sources used in this documentation
---

# Source Documents

All content in this documentation is derived from verified sources. Documents are available to AI tools via our MCP server.

::sources-table
::

## Verification Process

Sources are manually verified quarterly:
- **Government sources**: Checked against official .gov.in domains
- **Academic sources**: Verified through institutional repositories
- **NGO reports**: Cross-referenced with organizational websites

**Last comprehensive review:** January 2026

## Adding New Sources

To propose a new source document:
1. Verify credibility (government/academic institution)
2. Download official PDF
3. Submit via GitHub issue with verification details
```

**Create SourcesTable component** (from above).

---

### Task 6: Integration with Founder Funnel

  **Update root README:**

```markdown
## 📚 Authority Documentation (Beta)

Build domain authority alongside validation using our integrated **Docus documentation system**.

### Why Authority Matters

After validation proves demand exists, you need **differentiation**. Properly cited, expert-level content:
- Positions you as the domain expert
- Creates hard-to-replicate competitive moat
- Builds trust that converts visitors to customers

### Quick Start

```bash
  cd docs
  pnpm install
  pnpm dev

# Visit http://localhost:3000
# MCP: http://localhost:3000/mcp
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
```

  **Update landing page** (add Authority step to progression).

---

### Task 7: Decision Log

```markdown
<!-- templates/founder-funnel/content/pages/decisions/authority-docs.md -->
---
title: Authority Documentation via Docus
description: Adding domain expertise positioning to Founder Funnel
label: strategy
date: 2026-01-12
---

# Authority Documentation via Docus

## Problem

Validation proves demand exists. But in crowded markets, how do founders differentiate?

**Answer:** Domain authority through properly cited, expert-level content.

## Solution

Integrate Docus documentation system with:
- Auto-discovering citation system
- MCP resources for source documents
- Sources tracking page
- Dark Sky Maharashtra proof of concept

## Why This Works

**Competitive moat:**
- Properly cited content is hard to replicate
- Generic content marketing is commoditized
- Expert positioning builds trust → conversions

**AI-ready:**
- MCP server exposes docs to AI tools
- Source PDFs available to LLMs
- Future-proof for AI ecosystem

**Progressive adoption:**
- Optional (validation works without it)
- Separate `/docs` directory
- Independent deployment possible

## Technical Highlights

**Auto-references via transformer:**
- Write inline citations
- Nuxt Content transformer extracts all refs
- Auto-renders at page bottom
- Zero manual work

**MCP Resources:**
- Upload PDFs to `/public/sources`
- Define MCP resources in `/server/mcp/resources`
- AI tools access via `/mcp` endpoint
- Original documents available to LLMs

**Sources page:**
- Auto-generated table from MCP resources
- Shows credibility types
- Tracks verification dates
- Notes AI accessibility

## Scope

**POC includes:**
- Dark Sky Maharashtra case study
- 3-5 articles with proper citations
- 3-5 source PDFs exposed via MCP
- Sources tracking page
- Full MCP + LLMs integration

**POC excludes:**
- Automated fact-checking
- AI-powered source suggestions
- Multi-domain templates
- Database storage

## Success Criteria

- ✅ Docs deploy with auto-discovered references
- ✅ MCP resources accessible to AI tools
- ✅ Sources page shows all documents
- ✅ Case study demonstrates value
- ✅ Template users can replicate

## Next Steps

**After POC validation:**
- Gather user feedback
- Monitor adoption rate
- Consider AI enhancements
- Develop vertical templates

**Will NOT add:**
- Automated publishing workflows
- Complex authentication
- Database dependencies
- Forced coupling with validation

## Conclusion

Authority documentation complements validation:
- Validation = Prove demand
- Authority = Build differentiation
- Together = Powerful positioning

Stays true to "best part is no part" by remaining **optional** and **simple**.
```

---

## 🎯 Success Criteria

  **Immediate:**
  - ✅ References auto-discover from inline citations
  - ✅ MCP resources expose source PDFs
  - ✅ Sources page lists all documents
  - ✅ Dark Sky case study with 3-5 cited articles
  - ✅ Zero manual reference listing required

  **Long-term:**
  - User adoption metrics
  - Authority → conversion correlation
  - Case studies from template users
  - No complexity creep

---

## 📦 Deliverables for AI Agent

### Files to Create

1. **Docus Setup**
  - `/docs` directory structure
  - `app.config.ts`
  - `nuxt.config.ts`
  - `content.config.ts`

2. **Auto-Reference System**
  - `transformers/references.ts`
  - `components/content/Reference.vue`
  - `components/content/References.vue`
  - `app/layouts/docs.vue`

3. **MCP Resources**
  - `server/mcp/resources/*.ts` (one per source)
  - `public/sources/*.pdf` (placeholder PDFs)
  - `components/content/SourcesTable.vue`

4. **Content**
  - `content/sources.md`
  - `content/policy/maharashtra-guidelines.md`
  - `content/research/lonar-crater.md`
  - `content/implementation/municipal-lighting.md`

5. **Integration**
  - Updated root `README.md`
  - Updated `templates/founder-funnel/content/pages/index.md`
  - New decision log `templates/founder-funnel/content/pages/decisions/authority-docs.md`

### Key Principles

**Auto-discovery over manual:**
- Transformer finds all `:reference{}`
- Layout auto-renders References
- No manual listing

**MCP-first:**
- Source PDFs as MCP resources
- AI tools access automatically
- Sources page queries MCP

**Simple > Complex:**
- No databases
- No AI automation (yet)
- Manual verification process

**Optional, not forced:**
- Separate `/docs` directory
- Validation works without it
- Deploy independently

---

  **Ready to hand off to AI agent. All requirements clarified, no timelines specified.**
