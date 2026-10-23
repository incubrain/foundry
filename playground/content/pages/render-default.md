---
title: Render Default
description: Content-driven page with no layout hint.
---

# Own Heading

content-driven: this page is served by the layer catch-all `[...slug].vue`.
No `layout:` frontmatter and no `routeRules.appLayout` — should fall through to Nuxt's `default` layout.
No `hero:` key either (product-validator-4bc): the heading above is the page's own, and the catch-all must not stack an automatic hero on top of it.
