import type { H3Event } from 'h3'
import { hiddenPostPaths, queryLivePosts } from '../utils/posts'

// Discovery surfaces that read the content DB directly — llms.txt,
// llms-full.txt and the sitemap — must only ever see live posts.
//
// ORDER: the llms hooks below must run AFTER @nuxt/content's own
// (it fills `sections[].links` and `contents`; we then remove from them).
// Nitro runs plugins in registration order, so ./modules/blog sits after
// 'nuxt-llms' in layer/nuxt.config.ts — keep it there.

interface Section { contentCollection?: string, links?: { href: string }[], __nuxt_content_auto_generate?: boolean }
interface Doc { path: string, title?: string, seo?: unknown, body?: unknown }

const hiddenFor = (event: H3Event): Promise<Set<string>> =>
  ((event.context as Record<string, Promise<Set<string>>>).foundryBlogHidden ??= hiddenPostPaths(event))

/** `/raw/blog/x.md` and `https://site/blog/x` both mean the content path `/blog/x`. */
function contentPath(href: string): string {
  const { pathname } = new URL(href, 'http://localhost')
  return pathname.replace(/^\/raw(?=\/)/, '').replace(/\.md$/, '').replace(/\/index$/, '') || '/'
}

export default defineNitroPlugin((nitroApp) => {
  const on = <A extends unknown[]>(name: string, fn: (...args: A) => unknown) =>
    (nitroApp.hooks as unknown as { hook: (n: string, f: (...a: A) => unknown) => void }).hook(name, fn)

  // llms.txt — drop the link lines of posts that are not live.
  on('llms:generate', async (event: H3Event, options: { sections: Section[] }) => {
    const hidden = await hiddenFor(event)
    if (hidden.size === 0) return
    for (const section of options.sections) {
      if (section.links) section.links = section.links.filter(link => !hidden.has(contentPath(link.href)))
    }
    options.sections = options.sections.filter(s => !(s.__nuxt_content_auto_generate && s.links?.length === 0))
  })

  // llms-full.txt — blank a hidden post before it is rendered, then drop the empty chunk.
  on('content:llms:generate:document', async (event: H3Event, doc: Doc) => {
    if (!(await hiddenFor(event)).has(doc.path)) return
    Object.assign(doc, { title: '', seo: {}, body: { type: 'minimark', value: [] } })
  })
  on('llms:generate:full', (_event: H3Event, _options: unknown, contents: string[]) => {
    contents.splice(0, contents.length, ...contents.filter(chunk => chunk.trim() !== ''))
  })

  // sitemap — add live posts (the dynamic /blog/:slug route is not enumerable from the page tree).
  on('sitemap:input', async (ctx: { urls: { loc: string }[], event?: H3Event }) => {
    if (!ctx.event) return
    const known = new Set(ctx.urls.map(u => u.loc))
    for (const post of await queryLivePosts(ctx.event)) {
      if (!known.has(post.path)) ctx.urls.push({ loc: post.path, lastmod: post.updatedAt || post.publishAt } as { loc: string })
    }
  })
})
