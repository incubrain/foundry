# Blog Module — AI Agent Instructions

Git-based blog with render-time scheduling, plus the `foundry-blog` writer (CLI + MCP).

## File Map

```
layer/modules/blog/
├── index.ts                         # Module: pages, endpoints, guard, routeRules (off unless foundry.blog.enabled)
├── README.md                        # User documentation (setup, bin, MCP, leaks)
├── core/
│   ├── post.mjs / post.d.mts        # PURE: postState, isLive, slugify, renderPost, parsePost, validatePostInput
│   ├── store.mjs                    # Node-only: files + git (list/get/upsert/schedule/unpublish)
│   └── mcp.mjs                      # Stdio MCP server over the store
├── runtime/
│   ├── types.ts
│   ├── composables/                 # useBlogPosts, useBlogPost, useBlogSeo
│   └── pages/                       # BlogIndex.vue, BlogPost.vue (≤50 lines each)
└── server/
    ├── api/                         # posts.get.ts, post.get.ts → /api/_foundry/blog/*
    ├── routes/rss.xml.get.ts        # <prefix>/rss.xml (reuses rss/server/utils/rss-feed)
    ├── middleware/guard.ts          # 404 for raw-source routes of hidden posts
    ├── plugins/discovery.ts         # llms.txt / llms-full.txt / sitemap filters
    └── utils/                       # posts.ts (queries + liveness), guard.ts (pure path parser)
layer/bin/foundry-blog.mjs           # The bin (plain ESM — it runs from node_modules)
```

## Key Architecture

- **One liveness rule, in JS.** `isLive(row, new Date())` from `core/post.mjs` is the only
  place "live" is decided — the server utils, llms filter, sitemap and guard all call it.
  Never filter `publishAt` in SQL and never at build time.
- **`core/post.mjs` stays plain ESM with no Node-only imports** — Nuxt imports it for
  `isLive`; the bin imports it for everything. `store.mjs` and `mcp.mjs` are Node-only
  and must never be imported from `runtime/` or `server/`.
- **The bin has no TypeScript** (Node does not strip types under `node_modules`).
- Pages read through `/api/_foundry/blog/*` (same reason as `useContentPage`), not
  `queryCollection` in the page.
- The `article` layout is NOT reused: it is bound to the route→collection map, a string
  `image`, a `date` field, and `surround` (which would name unpublished posts).

## How to Modify

- **New frontmatter field:** add to `baseBlogSchema` (`layer/content.collections.ts`),
  `postInputSchema` + `KEY_ORDER` + `post.d.mts` (`core/post.mjs`), then use it in the pages.
- **New leak surface:** add the request shape to `server/utils/guard.ts` (with a test in
  `playground/test/unit/blog-post.test.ts`) or a hook to `plugins/discovery.ts`.
- **New CLI command:** add it to `core/store.mjs`, the switch in `bin/foundry-blog.mjs`,
  and a tool in `core/mcp.mjs`; extend `playground/test/unit/blog-{cli,mcp}.test.ts`.

## Design Principles
- Fail closed — a bad `publishAt` is a draft, an unreadable post is hidden.
- The file is the record — every write is one pathspec commit; never touch other paths.
- Scheduling is visibility, not secrecy (see the README's residual leak).
