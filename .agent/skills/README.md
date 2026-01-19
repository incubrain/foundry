# Agent Skills for Dark Sky Conservation Documentation

## Installed Skills

### Project-Specific Skills

#### docs-writer
**Primary skill for Dark Sky Conservation documentation**

- **Use when**: Writing or editing any documentation in `docs/content/`
- **Audience**: Government officials (department heads) and academic researchers
- **Sections**: Research (evidence), Policy (recommendations), Pilots (implementation)
- **Focus**: Content strategy, audience-appropriate tone, section-specific rules
- **Writing Standards**: Active voice (85%+), present tense (90%), precise modal verbs, 2-4 sentence paragraphs
- **Component Guidance**: When to use tip/info/warning/important callouts
- **Orchestrates**: Citation, component, and math validation passes
- **Merged from**: nuxt-document-writer writing style patterns (active voice, sentence structure, modal verbs, component usage)

### Nuxt Ecosystem Skills (from onmax/nuxt-skills)

#### nuxt
- **Use when**: Working with Nuxt 4+ configuration, server routes, middleware
- **Covers**: App config, server API, nitro, middleware patterns

#### nuxt-content
- **Use when**: Working with Nuxt Content v3 collections, queries, MDC
- **Covers**: Content collections, queryContent(), MDC components, navigation

#### nuxt-ui
- **Use when**: Working with Nuxt UI v4 components and design system
- **Covers**: UI components, theming, layout primitives

#### vue
- **Use when**: Developing Vue 3 components or composables
- **Covers**: Composition API, reactivity, component patterns

#### nuxthub
- **Use when**: Working with NuxtHub deployment and edge features
- **Covers**: Deployment, edge functions, database integration

#### motion
- **Use when**: Implementing animations with @vueuse/motion
- **Covers**: Animation directives, transition patterns

#### nuxt-modules
- **Use when**: Working with Nuxt module development or configuration
- **Covers**: Module authoring, hooks, plugin patterns


## Skill Architecture

### Primary Orchestrator
- **docs-writer**: High-level workflow, audience context, content rules

### Technical Reference
- **DOCUMENTATION_WRITING_GUIDELINES.md**: Technical syntax for citations, components, math notation

### Nuxt Ecosystem Support
- **nuxt/nuxt-content/nuxt-ui/vue/nuxthub/motion/nuxt-modules**: Technical expertise for framework

## Skill Usage in Practice

### Example 1: Writing Research Content
```
User: "Add section on agricultural impacts of light pollution"
Agent: Uses docs-writer skill
- Applies Research section rules
- Authoritative but accessible tone
- Global evidence with citations
- Maharashtra context in callout only
```

### Example 2: Working on Nuxt Content Config
```
User: "Configure content collections for glossary"
Agent: Uses nuxt-content skill
- Provides Nuxt Content v3 collection syntax
- QueryContent() API usage
- Navigation generation patterns
```

### Example 3: Building UI Component
```
User: "Create citation popover component"
Agent: Uses vue + nuxt-ui skills
- Vue 3 Composition API patterns
- Nuxt UI component integration
- Reactive state management
```

## Maintenance Notes

- **Last updated**: 2026-01-19
- **Upstream version**: onmax/nuxt-skills (latest as of update)
- **Custom skills**: docs-writer (project-specific, not in upstream)
- **Pruned skills**: nuxt-better-auth, reka-ui, ts-library (not needed for this project)
