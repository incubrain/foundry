# Blog Module

A git-based blog whose posts **go live on their own**. A post is a markdown file with a
`publishAt` time; the site decides whether it is live **per request**, so a post committed
with a future `publishAt` stays unlisted and 404 until that moment — no rebuild, no cron.

Writes come from the `foundry-blog` bin (CLI + stdio MCP server) that a producer shells
inside the site repo. It writes the file and commits it; your normal deploy does the rest.

## Consumer setup

1. Declare a `blog` page collection with the shared schema (`content.config.ts`):

```ts
import { defineContentConfig, defineCollection } from '@nuxt/content'
import { baseBlogSchema } from '@incubrain/foundry/schemas'

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: { include: 'blog/**/*.md', prefix: '/blog' },
      schema: baseBlogSchema,
    }),
  },
})
```

2. Enable the module (`nuxt.config.ts`):

```ts
export default defineNuxtConfig({
  foundry: { blog: { enabled: true } }, // prefix: '/blog', title: 'Blog'
})
```

You get `/blog` (live posts, newest first), `/blog/<slug>`, and `/blog/rss.xml`. The
collection name must be `blog`, and its `prefix` must equal `foundry.blog.prefix`.

| Option | Default | Description |
|---|---|---|
| `foundry.blog.enabled` | `false` | Register pages, endpoints, feed and guards |
| `foundry.blog.prefix` | `'/blog'` | URL prefix for the list and posts |
| `foundry.blog.title` | `'Blog'` | List page heading and feed title |

## Scheduling semantics

| State | When | Visible? |
|---|---|---|
| `draft` | `draft: true`, or `publishAt` missing/invalid | never |
| `scheduled` | `draft: false` and `publishAt` is in the future | never |
| `live` | `draft: false` and `publishAt <= now` | everywhere |

- `publishAt` is an ISO 8601 string; the CLI always writes UTC with a `Z`
  (`2026-10-20T09:00:00.000Z`). A date-only or offset-less value is read as UTC.
- Draft wins over everything. A bad `publishAt` fails **closed** (draft).
- "Now" is the request time: `isLive(post, new Date())` in JS
  (`core/post.mjs`). Never compare `publishAt` in SQL — mixed offsets do not sort as strings.
- The post file must be **deployed** before it can go live. Committing is the publishing
  step; the schedule only controls *when* an already-deployed post appears.
- `/blog`, `/blog/**` and `/raw/blog/**` are never prerendered (`routeRules` +
  `nitro.prerender.ignore`, so `crawlLinks` in CI cannot bake them either) and the pages
  send `Cache-Control: public, max-age=0, must-revalidate`. If a CDN sits in front, do
  not override that with a long TTL or go-live is delayed by it.
- It needs the server runtime. `nuxt generate` (fully static) cannot show a post that
  goes live after the build. If the build prerenders `/llms.txt` or `/sitemap.xml`
  (CI with `crawlLinks`), those two files are frozen at build time: they hide
  scheduled posts but also omit posts that go live later until the next deploy.

## `foundry-blog` bin

Installed as `foundry-blog` from `@incubrain/foundry` (`npx foundry-blog …`). Plain ESM,
no TypeScript. stdout is **one JSON object**.

```bash
foundry-blog list
foundry-blog get <slug>
echo '{"title":"Hello","body":"# Hi","publishAt":"2026-10-20T09:00:00Z"}' | foundry-blog upsert
foundry-blog schedule <slug> --at 2026-10-20T09:00:00Z
foundry-blog unpublish <slug>
foundry-blog mcp          # stdio MCP server
```

Flags: `--root <site repo>` (default cwd), `--dir <content dir>` (default `content/blog`),
`--branch <name>` (refuse unless HEAD is that branch), `--no-commit`, `--push` (push the
current branch to its upstream after the commit; off by default),
`--author "Name <email>"` (passed to `git commit --author`).

`upsert` input: `{slug?, title, description?, body, publishAt?, draft?, canonical?, author?, tags?, image?, source?}`.
`slug` defaults to a slug of the title (a non-Latin title needs an explicit `slug`).
`publishAt` defaults to **now on create**; on update, absent fields keep their stored
value and `null` clears one. Identical content is `changed: false` with no commit.
Output: `{ok, slug, path, state, publishAt, commit, pushed, changed}`; commits only that
path with `blog: <created|updated> <slug> (<state>, <publishAt>)`.

Refusals print `{ok:false, error, message}` and exit **2**: `invalid`, `no-post`,
`not-a-repo`, `record-dirty` (the target file has uncommitted changes), `wrong-branch`,
`commit-failed` (a hook or git identity rejected it; the write is rolled back),
`push-failed` (the commit is kept; its sha is in the payload).

### MCP

`foundry-blog mcp --root <site repo>` serves `list_posts`, `get_post`, `upsert_post`,
`schedule_post`, `unpublish_post` over stdio, calling the same functions. The flags above
set the defaults for every tool call. Project `.mcp.json`:

```json
{
  "mcpServers": {
    "foundry-blog": {
      "command": "npx",
      "args": ["foundry-blog", "mcp", "--root", ".", "--branch", "main"]
    }
  }
}
```

## Leaks closed, and one that isn't

A scheduled post is in the repo and in the built content DB, so every surface that reads
the DB directly needed a liveness filter:

| Surface | Handling |
|---|---|
| `/blog`, `/blog/<slug>`, `/blog/rss.xml` | filtered per request in JS |
| `llms.txt` / `llms-full.txt` (auto-sections from page collections) | `server/plugins/discovery.ts` drops hidden posts' links and bodies |
| `/raw/blog/<slug>.md` (Nuxt Content's raw route), `/blog/<slug>.md` | `server/middleware/guard.ts` returns 404 |
| `/api/_foundry/content/page\|surround?collection=blog` | same guard |
| sitemap | live posts are added through the `sitemap:input` hook; scheduled ones never are |
| `markdown-rewrite` (`.md`, `Accept: text/markdown`) | queries the `pages` collection only, so it never serves blog posts; it steps aside for the blog prefix so `/raw/blog/<slug>.md` reaches Nuxt Content's raw route, which the guard gates |
| MCP `list-pages` / `get-page` | `pages` collection only |

**Residual leak:** Nuxt Content's own query endpoint (`/__nuxt_content/blog/query`) and its
SQL dump (`/__nuxt_content/blog/sql_dump.txt`) can still return scheduled rows to anyone who
asks for them — server-side `queryCollection` calls that same endpoint in-process, so it
cannot be blocked without breaking every page. Scheduling
is a visibility rule, **not secrecy** — do not put an embargoed secret in a scheduled post;
keep it on an unmerged branch until it should be public.

Plugin order matters: `./modules/blog` must stay after `nuxt-llms` in
`layer/nuxt.config.ts`, so its llms hooks run after Nuxt Content's.
