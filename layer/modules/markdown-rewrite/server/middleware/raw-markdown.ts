import type { H3Event } from 'h3'
import { createError, defineEventHandler, getRequestHeader, setResponseHeader } from 'h3'
import { queryCollection } from '@nuxt/content/server'
import type { Collections } from '@nuxt/content'
import {
  CONTENT_ASSET_BASE,
  CONTENT_PAGES_DIR,
  assetKeyToContentPath,
  contentAssetKeys,
  parseMarkdownRequest,
} from '../../utils/negotiation'

/**
 * Serves the raw markdown source of a content page on ANY Nitro deployment
 * (Docker/Railway/standalone Node, dev included) — not just Vercel edge.
 *
 * Ordering: this is registered by the `markdown-rewrite` module, which sits
 * AFTER `./modules/events` in the layer's `modules` array, so every middleware
 * the events module registers (page-request signal capture included) runs
 * first. `isPageRequest()` (`modules/events/server/utils/page-request.ts`)
 * admits `.md` suffixes, `Accept: text/markdown` negotiation, and
 * `/llms.txt` / `/llms-full.txt`, so a `page_request` row is appended for
 * this traffic before it ever reaches this handler — agent requests are
 * signal too. Anything registered after this middleware is skipped for a
 * matched `.md` request, because returning a value from Nitro middleware
 * closes the request.
 */
export default defineEventHandler(async (event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return

  const request = parseMarkdownRequest(event.path, getRequestHeader(event, 'accept'))
  if (!request) return

  // Blog posts are not served from the `pages` collection: leave `/raw/<blog>/x.md`
  // to @nuxt/content's own raw route, which the blog module's guard gates on
  // liveness (modules/blog/server/middleware/guard.ts).
  const blogPrefix = (useRuntimeConfig(event).public.foundryBlog as { prefix?: string } | undefined)?.prefix
  if (blogPrefix && (request.contentPath === blogPrefix || request.contentPath.startsWith(`${blogPrefix}/`))) return

  const source = await readContentSource(event, request.contentPath)

  if (source === null) {
    // Negotiation is a *preference*: with no markdown representation the HTML
    // renderer keeps the route. An explicit `.md` URL has no such fallback.
    if (request.mode === 'accept') return
    throw createError({
      statusCode: 404,
      statusMessage: 'No markdown source for this route',
    })
  }

  setResponseHeader(event, 'content-type', 'text/markdown; charset=utf-8')
  // The canonical URL serves two representations — caches must key on Accept.
  setResponseHeader(event, 'vary', 'Accept')
  if (request.mode === 'suffix') {
    setResponseHeader(event, 'link', `<${request.contentPath}>; rel="canonical"`)
  }

  return source
})

/**
 * `@nuxt/content` decides whether a route IS a content page (its DB is the
 * only thing that knows about excluded/unpublished documents); the mounted
 * server asset supplies the bytes, since the DB stores a parsed AST rather
 * than the original file.
 */
async function readContentSource(event: H3Event, contentPath: string): Promise<string | null> {
  const document = await queryCollection(event, 'pages' as keyof Collections)
    .path(contentPath)
    .select('path' as 'id')
    .first()
    .catch(() => null)

  if (!document) return null

  const storage = useStorage(`assets:${CONTENT_ASSET_BASE}`)

  for (const key of contentAssetKeys(contentPath)) {
    const raw = await readText(storage, key)
    if (raw !== null) return raw
  }

  // Ordering prefixes (`1.intro.md`) make the file name diverge from the URL.
  const keys = await storage.getKeys(CONTENT_PAGES_DIR).catch(() => [] as string[])
  const match = keys.find(key => assetKeyToContentPath(key) === contentPath)

  return match ? await readText(storage, match) : null
}

/** Server assets come back as a string in dev and as bytes from the bundle. */
async function readText(
  storage: ReturnType<typeof useStorage>,
  key: string,
): Promise<string | null> {
  const raw = await storage.getItemRaw(key).catch(() => null)
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'string') return raw
  if (raw instanceof Uint8Array) return new TextDecoder().decode(raw)
  return null
}
