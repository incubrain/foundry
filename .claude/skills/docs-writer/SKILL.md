---
name: docs-writer
description: Creates and edits Dark Sky Conservation policy documentation for Maharashtra government officials and academics. Handles audience-appropriate tone, section-specific content rules (Research/Policy/Pilots), and orchestrates technical validation passes. Use when working on docs/content/ markdown files.
---

## Target Audience

Documentation serves two primary audiences:

### 1. Government Officials
- **Level**: State department heads and senior bureaucrats
- **Departments**: Environment, Tourism, Energy, Agriculture, Forest, Public Health
- **Needs**: Evidence-based justification for policy action, clear recommendations, implementation guidance
- **Reading context**: Decision-making on policy adoption and resource allocation

### 2. Academic Researchers
- **Level**: Policy analysts, technical advisors, research institutions
- **Institutions**: IIT, IISER, TIFR, environmental organizations
- **Needs**: Rigorous citations, methodological clarity, data transparency
- **Reading context**: Evidence evaluation, peer review, technical consultation

## Writing Principles

### Tone and Voice

**Authoritative but Accessible**
- Third-person objective voice (API reference style)
- Evidence-based assertions (every claim cited)
- Technical terms explained on first use
- Confident recommendations without overstatement

**Guiding, Not Assuming**
- Explain reasoning behind recommendations
- Acknowledge iteration and refinement process
- Present options with trade-offs when applicable
- Respect reader intelligence while providing context

### Writing Quality Standards

**Grammar and Clarity**
- Grammatically correct and properly punctuated
- Complete sentences (not fragments)
- Clear and unambiguous phrasing
- Brevity valued, but never at cost of clarity

**Active Voice (85%+)**
- Subject performs action: "The study documents..." (not "is documented by")
- Direct and clear: "Maharashtra can implement..." (not "can be implemented")
- Passive acceptable when: actor unknown, object more important, or describing system behavior

**Present Tense (90%)**
- Current state: "Research demonstrates..."
- Recommendations: "Policy should require..."
- Future only for consequences: "This will reduce emissions by..."

### Modal Verbs (Precision in Recommendations)

Use modal verbs to convey appropriate certainty and obligation:

| Verb | Meaning | Usage | Example |
|------|---------|-------|---------|
| `can` | Optional (40%) | Capabilities, options | "Municipalities can implement lighting curfews." |
| `should` | Recommended (30%) | Best practices | "Policies should prioritize ecological zones." |
| `may` | Possibility (20%) | Conditional outcomes | "This may reduce bird collisions." |
| `must` | Required (10%) | Mandatory actions | "Protected areas must limit upward light." |

Avoid weak modals: `might`, `could`, `would` (use sparingly, only for hypotheticals)

### Content Maturity Stages

| Section | Current Stage | End Goal |
|---------|--------------|----------|
| **Research** | Evidence compilation | Scientific foundation for policy |
| **Policy** | Recommendations → Refined proposals | Foundation for official policy |
| **Pilots** | Guidelines → Standards | Adopted implementation protocols |

**Language reflects stage**:
- Research: "Studies document...", "Evidence indicates..."
- Policy (early): "Recommendations include...", "Framework proposes..."
- Policy (refined): "Notification shall require...", "Standards mandate..."
- Pilots (early): "Guidelines suggest...", "Methodology encompasses..."
- Pilots (refined): "Standards require...", "Protocols specify..."

### Sentence Patterns

**Subject-First Declarative (60%)**
```
Light pollution disrupts nocturnal ecosystems.
The UNFCCC recognizes lighting efficiency as a climate strategy.
Maharashtra's protected areas face light intrusion.
```

**Imperative Instructions (25%)**
```
Review the ecological impact evidence in Section 2.1.
Consider the economic burden documented by RAND Europe.
Implement shielding requirements for coastal lighting.
```

**Contextual Openers (15%)**
```
When protecting migratory corridors, restrict lighting to essential safety needs.
During pilot implementation, monitor sky brightness monthly.
For agricultural zones, prioritize pollinator-friendly spectrum.
```

### Paragraph Structure

**Length**: 2-4 sentences maximum
**Structure**: Topic sentence first, then supporting details

```
Route middleware runs before navigation.
Use it to check authentication or redirect users.
Define middleware in the middleware directory.
```

**Opening Sentences**
- Define what it is, its purpose, key benefits
- Avoid: "This section describes...", "In this document...", "Let's explore..."
- Instead: State directly what the content covers

## Section-Specific Rules

### Research Section (`/docs/content/docs/1.research/`)

**Purpose**: Global scientific evidence documenting light pollution impacts

**Include**:
- Peer-reviewed studies with citations
- Global data and international examples
- Universal phenomena (ecological, health, climate impacts)
- Maharashtra context ONLY in `::callout{color="info"}` (1-2 sentences, factual)

**Exclude**:
- Policy recommendations (belongs in Policy section)
- Implementation details (belongs in Pilots section)
- "Why Maharashtra Must Act" sections
- "Next Steps" sections

**Example structure**:
```markdown
## 2. Agricultural Impacts

Overview text without citations explaining the category.

### 2.1 Pollination

:cite[Light pollution disrupts nocturnal pollinator activity]{#study-id}. Research documents :cite[62% reduction in pollinator visits under ALAN conditions]{#another-study}.

::callout{color="info"}
Maharashtra's agricultural economy depends heavily on pollinator-dependent crops including cotton, pulses, and fruits.
::
```

### Policy Section (`/docs/content/docs/2.policy/`)

**Purpose**: Legal frameworks, Maharashtra obligations, action plans

**Include**:
- Constitutional obligations and legal precedents
- International treaty commitments
- State-specific regulatory frameworks
- Recommended policy mechanisms
- Justifications tied to Research evidence

**Tone progression**:
- Early drafts: "Recommendations", "Framework proposes"
- Refined drafts: "Policy shall", "Standards require"

**Example structure**:
```markdown
## 2. Dark Sky Zones Framework

This framework proposes classification of protected nighttime environments based on ecological sensitivity and astronomical value.

### 2.1 Zone Categories

**Tier 1: Core Dark Sky Reserves**
- Protected areas with <21.5 mag/arcsec² sky brightness
- Minimal artificial lighting permitted
- Examples: Bhimashankar Wildlife Sanctuary buffer zones
```

### Pilots Section (`/docs/content/docs/3.pilots/`)

**Purpose**: Implementation methodology (not specific site listings)

**Include**:
- Selection criteria for pilot sites
- Measurement protocols
- Stakeholder engagement processes
- Monitoring frameworks
- Institutional coordination mechanisms
- Implementation phases

**Exclude**:
- Specific site selections (too premature)
- Detailed budget allocations
- Named individual responsibilities

**Example structure**:
```markdown
## 2. Site Selection Methodology

Pilot zones should be selected using a multi-criteria framework balancing ecological sensitivity, astronomical potential, and implementation feasibility.

### 2.1 Selection Criteria

**Ecological Priority**
- Presence of light-sensitive species
- Proximity to protected areas
- Migratory corridor significance
```

## Component Usage Patterns

Use the right component for the right purpose:

| Need | Component | When to Use | Example Context |
|------|-----------|-------------|-----------------|
| Key statistics | `::tip` | Highlighting quantified findings | "**Key Statistic**: :cite[62% reduction in pollinator visits]{#study}" |
| Maharashtra context | `::callout{color="info"}` | State-specific notes in Research | "**Maharashtra Context**: Western Ghats biodiversity hotspot..." |
| Background info | `::note` | Supplementary context | Explaining technical terms or processes |
| Best practice | `::tip` | Recommendations | Policy implementation guidance |
| Caution | `::warning` | Potential issues | Implementation challenges |
| Must-know | `::important` | Required actions | Mandatory compliance requirements |
| Success indicator | `::callout{color="success"}` | Positive outcomes | "Dark Sky Conservation offers a 'quick win'..." |

**Component Selection Guide**:
- Research section: Use `::tip` for key statistics, `::callout{color="info"}` for Maharashtra context
- Policy section: Use `::important` for requirements, `::tip` for recommendations
- Pilots section: Use `::warning` for implementation challenges, `::tip` for best practices

## Code and Data Presentation

### Code Block Labels
Always include file paths or context:

````md
```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['@nuxt/content']
})
```

```bash
npm install katex rehype-katex remark-math
```
````

### Tables for Data
Use tables for quantified comparisons:

```md
| Impact Domain | Key Finding | Relevant Departments |
|---------------|-------------|---------------------|
| Ecology | 62% pollination reduction | Environment, Agriculture |
| Health | 40% CVD risk increase | Public Health |
```

## Workflow and Skill Orchestration

When working on documentation:

1. **Content Phase** (this skill - docs-writer)
   - Determine section type (Research/Policy/Pilots)
   - Apply audience-appropriate tone
   - Follow section-specific rules
   - Structure content logically
   - Use active voice (85%+), present tense (90%)
   - Apply modal verbs appropriately (can/should/may/must)
   - Keep paragraphs 2-4 sentences

2. **Citation Phase** (refer to DOCUMENTATION_WRITING_GUIDELINES.md)
   - Wrap the cited claim or source name inside the brackets: `:cite[cited text]{#id}`
   - Multiple citations: `:cite[cited text]{#id1,id2}`
   - The text inside `[...]` should be the fact, statistic, or source name the citation supports
   - Example: `:cite[60% of invertebrates are nocturnal]{#holker-2010}`
   - Example: `:cite[The 2023 RAND Europe study]{#hafner-2023-insomnia-burden}` quantifies...

3. **Component Phase** (refer to DOCUMENTATION_WRITING_GUIDELINES.md)
   - Select appropriate callout type (tip/info/warning/important/success)
   - Card groups, accordions, etc.
   - Internal links: `[text](internal:path)`
   - Glossary terms: `:dfn[term text]{#term-id}`

4. **Math Phase** (refer to DOCUMENTATION_WRITING_GUIDELINES.md)
   - Inline: `$expression$`
   - Display: `$$expression$$`
   - Escape dollar signs: `\$4.32 trillion`
   - Units: `$0.757\,\mathrm{tCO_2/MWh}$`

## Data Source

**ALL quantitative data must come from**: `/Users/mac/Development/incubrain/product-validator/docs/MASTER_KEY.md`

Never invent statistics. Never extrapolate data not in Master Key. If data is not available, note the research gap instead.

## Common Writing Mistakes to Avoid

**Voice and Clarity**
- Starting sentences with "It" or "This" without clear antecedent
- Overusing passive voice: "is documented by" → "documents"
- Stacking prepositions: "the value of the property of the config"
- Weak language: "might", "could", "would" (use precise modals)

**Word Choice**
| Avoid | Use |
|-------|-----|
| utilize | use |
| implement | add, create, establish |
| leverage | use |
| in order to | to |
| due to the fact that | because |

**Structure**
- Burying important info at end of long sentences
- Overusing "Note that" (just state the fact directly)
- Starting with meta-commentary: "This section describes..."
- Paragraphs exceeding 4 sentences

**Documentation-Specific**
- Mixing section types (policy in Research, evidence in Pilots)
- Maharashtra content outside callouts in Research section
- Citations before punctuation
- Inventing data not in MASTER_KEY.md
- Using em-dashes (—) instead of commas or parentheses

## Quality Checks

Before finalizing content:

- [ ] Audience-appropriate tone (authoritative but accessible)
- [ ] Section rules followed (Research/Policy/Pilots)
- [ ] Language matches content maturity stage
- [ ] Active voice 85%+, present tense 90%+
- [ ] Modal verbs used precisely (can/should/may/must)
- [ ] Paragraphs 2-4 sentences maximum
- [ ] All data from MASTER_KEY.md
- [ ] Citations properly placed (after punctuation)
- [ ] Appropriate component types (tip/info/warning/important)
- [ ] No em-dashes (—)
- [ ] No H1 title duplication from frontmatter
- [ ] No weak modals (might/could/would)
- [ ] No starting with "It" or "This" without clear referent
- [ ] Technical validation passes (citations, components, math) completed

## Related Guidelines

For technical syntax details, always refer to:
- `/Users/mac/Development/incubrain/product-validator/docs/DOCUMENTATION_WRITING_GUIDELINES.md`

This skill focuses on **content strategy and audience**. The guidelines document handles **technical syntax**.
