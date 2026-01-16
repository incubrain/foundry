# Documentation Writing Guidelines

## 1. Citations

### Placement
Citations ALWAYS come after punctuation:
```markdown
✅ under light-polluted skies.[2]
❌ under light-polluted skies[2].
```

### Position in Report References
When naming a study/report in text, cite immediately after the name. Otherwise, cite at sentence end:
```markdown
✅ The Frontiers in Neuroscience study[5] demonstrates lasting impacts.
✅ Chronic light cycle disruption affects circadian development.[5]
❌ Disruption affects behavior.[5] The Frontiers study demonstrates impacts.
```

### Syntax
- `[](cite:citation-id)` - numbered citation
- `[text](cite:citation-id)` - inline citation with text
- `[](cite:id1,id2,id3)` - multiple citations

---

## 2. Components

### Callout
```markdown
::callout{color="info"}
Content
::
```
Colors: `info`, `success`, `warning`, `danger`

### Card Group
```markdown
::card-group
  ::card{icon="i-heroicons-beaker" title="Title" to="/link"}
  Content
  ::
::
```

### Other Docus Components
  - **Accordion**: `::accordion` + `::accordion-item{label="..."}`
  - **Badge**: `::badge{color="primary"}`
  - **Collapsible**: `::collapsible{label="..."}`
  - **Icon**: `::icon{name="i-heroicons-beaker"}`
  - **Kbd**: `::kbd{value="Ctrl+C"}`
  - **Steps**: `::steps` with H3 for each step
  - **Tabs**: `::tabs` with `::div{label="..."}`

---

## 3. Content Rules by Section

### Research (`/research/`)
**Focus**: Global scientific evidence

**✅ Include:**
- Peer-reviewed studies with citations
- Global data and international examples
- Maharashtra context in `::callout{color="info"}` only (1-2 sentences, factual)

**❌ Exclude:**
- Policy recommendations (belongs in Policy section)
- Implementation details (belongs in Pilots section)
- "Why Maharashtra Must Act" sections
- "Next Steps" sections

### Policy (`/policy/`)
**Focus**: Legal frameworks, Maharashtra obligations, action plans

### Pilots (`/pilots/`)
**Focus**: Implementation methodology (not specific site listings)

---

## 4. Data Integrity

  **ALL data must come from Master Key document**: `/Users/mac/Development/incubrain/product-validator/docs/MASTER_KEY.md`

  Never invent statistics or extrapolate data not in Master Key.

---

## 5. Writing Style

### Avoid Em-Dashes
```markdown
✅ impacts across life stages, from newborns to elderly populations.
✅ impacts across life stages (from newborns to elderly populations).
❌ impacts across life stages—from newborns to elderly populations.
```

### Section Structure
Main sections (H2) need overview text before subsections. Citations belong in subsections:
```markdown
✅ ## 2. Agricultural Impacts
   Overview text without citations.

   ### 2.1 Pollination
   Detailed text with citations.[5]

❌ ## 2. Agricultural Impacts[5]
   ### 2.1 Pollination
```

---

## 6. Links

### Internal Documentation Links
```markdown
[Policy Framework](internal:policy)
[Ecology](internal:research/ecology)
```
  ProseA.vue maps `internal:` → `/` paths.

### Glossary Term Links
```markdown
[ALAN](term:ALAN)
[light pollution](term:light pollution)
[dark sky certification](term:dark sky certification)
```
  ProseA.vue maps `term:` → `/glossary#term-id` anchors with dotted underline styling.

---

## 7. File Naming

Use `00-99` numbering for ordering:
```
00.index.md
01.ecology.md
02.health.md
...
10.page.md
```

Multi-word names: `01.economic-impacts.md`

---

## 8. Frontmatter

```markdown
---
title: Page Title (Full H1)
description: One-sentence summary
label: Sidebar Label (Short)
departments: [Dept1, Dept2]
department_summary: Brief context for specific departments
---
```

  **DO NOT duplicate H1 title in markdown body** (Docus auto-renders frontmatter title).

  **✅ Correct:**
```markdown
---
title: Ecology & Biodiversity
label: Ecology (Short name for Nav)
navigation:
  title: Ecology
description: Scientific evidence documenting ALAN impacts on biodiversity...
departments:
  - Environment
  - Agriculture
department_summary: Light pollution is now recognized as a significant biodiversity threat...
---

## Overview
Text here...
```

  **❌ Incorrect:**
```markdown
---
title: Ecology & Biodiversity
---

# Ecology & Biodiversity

## Overview
```

---

## 9. Math Notation

LaTeX support via `remark-math` and `rehype-katex`:

**Inline**: `$E = mc^2$`

**Display**:
```markdown
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

---

## 10. Quality Checklist

  - [ ] Citations after punctuation
  - [ ] Citations after document names or at sentence end
  - [ ] Component syntax correct (`color=`, `card-group`)
  - [ ] No em-dashes (—)
  - [ ] No H1 title duplication
  - [ ] File naming uses 00-99 system
  - [ ] Main sections have overview before subsections
  - [ ] Citations in subsections, not overviews
  - [ ] No policy content in Research section
  - [ ] All data from Master Key
  - [ ] Maharashtra context in info callouts only (Research)
  - [ ] Internal links use `internal:` prefix

---

## Common Mistakes

**❌ Don't:**
1. Put citations before punctuation
2. Use em-dashes (—)
3. Duplicate H1 from frontmatter
4. Use wrong numbering (1.x vs 01.x)
5. Put citations in section overviews
6. Use `type=` in callout (use `color=`)
7. Use `::card-grid` (use `::card-group`)
8. Add policy to Research section
9. Invent data not in Master Key
10. Mix `internal:` and `/` link formats

---

## Revision History

  - **2026-01-15**: Initial guidelines
  - **2026-01-15**: Added 8 rules (internal links, em-dash, frontmatter, 00-99, overviews, citations, math, components)
  - **2026-01-15**: Condensed to 50% length for readability
