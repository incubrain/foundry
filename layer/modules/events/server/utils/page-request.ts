import type { H3Event } from 'h3'
import type { VisitorClass } from '../../runtime/types/signal'
import { appendSignal } from './signal-buffer'
import { describeVisitor } from './visitor-class'

/**
 * Server-side page-visit capture — the ingest path for visitors that never run
 * our JavaScript.
 *
 * `ui.page` is emitted by `runtime/plugins/identity.client.ts`, so it only ever
 * exists for a client that booted Nuxt. GPTBot, ClaudeBot and PerplexityBot do a
 * plain GET, parse the HTML and leave: before this, the single most interesting
 * traffic on a Foundry site left no row at all, and the README's
 * every-visit-is-signal claim was false for exactly the visitors the
 * agentic-vs-human KPI (VISION.md) is about.
 *
 * ## `page_request` vs `ui.page` — do not sum them
 *
 * Deliberately a different `name`, not a second `ui.page`:
 *
 * - `page_request` — **one per document GET reaching the server.** Emitted for
 *   every visitor class, JS or not. It does *not* fire on a client-side route
 *   change, because no request is made.
 * - `ui.page` — **one per route the client actually rendered**, including SPA
 *   transitions that never touch the server. Only ever exists for `human`-ish
 *   traffic that runs JS.
 *
 * They measure different things and are never the same row, so a consumer picks
 * one rather than adding them: `ui.page` for "pages a real browser rendered",
 * `page_request` for "documents served", and `page_request` filtered on
 * `visitor.class` / `visitor.subclass` for the agent traffic split. A hard
 * navigation by a JS-capable human legitimately produces one of each — that is
 * two facts, not one fact counted twice.
 *
 * Volume is held down by the filters below rather than by dropping humans: only
 * real page GETs qualify, so a visit adds one row, against the ~60 the identity
 * stream already emits.
 */

/** `page` is capped to the same length the ingest schema allows. */
const MAX_PAGE = 512
const MAX_REFERRER = 512
const MAX_USER_AGENT = 512

/**
 * Route prefixes that are never a page visit. `/api/**` covers the layer's own
 * `_health`, `_signals` and `_foundry` endpoints; the bare forms are listed too
 * so a consuming site that mounts them at the root can't leak rows in.
 */
const IGNORED_PREFIXES = [
  '/api/',
  '/_nuxt/',
  '/_ipx/',
  '/_scripts/',
  '/_signals/',
  '/_health',
  '/_vercel/',
  '/.well-known/',
  '/@vite/',
  '/@id/',
  '/@fs/',
  '/node_modules/',
  '/__nuxt',
  '/__webpack',
]

/**
 * Anything with a file extension is an asset, not a page — favicon.ico,
 * robots.txt, sitemap.xml, *.js, *.css, *.png, *.map. `.html` and `.md` are
 * the exceptions: a prerendered site serves real pages at `/about.html`, and
 * `markdown-rewrite`'s `raw-markdown.ts` middleware serves the same content
 * page's source at `/about.md` — an agent-native document, not an asset.
 */
const ASSET_EXTENSION = /\.(?!html?$|md$)[a-z0-9]{1,8}$/i

/**
 * Root-level agent documents `nuxt-llms` ships with a `.txt` extension
 * (`layer/nuxt.config.ts`). `ASSET_EXTENSION` would otherwise drop them the
 * same way it drops robots.txt/sitemap.xml — an exact-path allowlist rather
 * than widening the extension rule, since `.txt` stays a real asset
 * extension everywhere else.
 */
const AGENT_DOCUMENT_PATHS = new Set(['/llms.txt', '/llms-full.txt'])

export interface PageRequestCandidate {
  method: string
  path: string
  /** `Accept` request header, if any. */
  accept?: string | null
  /** `Sec-Fetch-Dest`, when the client sends it. */
  secFetchDest?: string | null
  /** True while Nitro is crawling the site to prerender it. */
  prerender?: boolean
}

/**
 * Is this request a real page view worth a signal row?
 *
 * Pure and exported so the rules are unit-testable without booting Nitro.
 *
 * Rejects, in order:
 * 1. **Not a GET.** POSTs are captured by their own handlers; HEAD is a probe.
 * 2. **Prerender-build traffic.** `nuxi generate` crawls the whole site through
 *    the same middleware; those are our own build's fetches, not visitors.
 * 3. **Internal / framework routes** (`IGNORED_PREFIXES`).
 * 4. **Assets** — any path with a non-`.html`/`.md` file extension, unless
 *    it's one of the named `AGENT_DOCUMENT_PATHS` (`/llms.txt`,
 *    `/llms-full.txt`). `.md` and the two `llms*.txt` documents are the
 *    agent-native surfaces `markdown-rewrite` and `nuxt-llms` serve — real
 *    document GETs, not assets, even though they aren't HTML.
 * 5. **Non-document fetches.** `Sec-Fetch-Dest` is authoritative when present
 *    (`document` / `iframe` pass, `script`/`image`/`empty` don't), which drops
 *    `$fetch` calls and prefetches from real browsers. When it's absent — the
 *    normal case for a crawler — an `Accept` header that names a type must name
 *    an HTML- or markdown-ish one; a wildcard `Accept` and a missing `Accept`
 *    both pass, because that is what a bare crawler GET looks like.
 */
export function isPageRequest(candidate: PageRequestCandidate): boolean {
  const { method, path, accept, secFetchDest, prerender } = candidate

  if (method.toUpperCase() !== 'GET') return false
  if (prerender) return false

  const pathname = (path.split('?')[0] || '/').toLowerCase()

  if (IGNORED_PREFIXES.some(prefix => pathname.startsWith(prefix))) return false
  if (!AGENT_DOCUMENT_PATHS.has(pathname) && ASSET_EXTENSION.test(pathname)) return false

  if (secFetchDest) return secFetchDest === 'document' || secFetchDest === 'iframe'

  if (accept) {
    const wantsDocument = accept.includes('text/html')
      || accept.includes('application/xhtml')
      || accept.includes('text/markdown')
      || accept.includes('*/*')
    if (!wantsDocument) return false
  }

  return true
}

/**
 * Was this row served as markdown rather than HTML? Purely a labelling
 * concern — it never affects whether {@link isPageRequest} admits the
 * request — so it's kept separate and only consulted once a candidate has
 * already passed the filter, to stamp `data.format` on the emitted row.
 */
export function pageRequestFormat(candidate: PageRequestCandidate): 'markdown' | 'html' {
  const pathname = (candidate.path.split('?')[0] || '/').toLowerCase()
  if (pathname.endsWith('.md') || AGENT_DOCUMENT_PATHS.has(pathname)) return 'markdown'
  if (candidate.accept?.includes('text/markdown')) return 'markdown'
  return 'html'
}

/** Query string stripped: `page` matches `pageContext()` on the client, which reports `location.pathname`. */
export function pageFromPath(path: string): string {
  return (path.split('?')[0] || '/').slice(0, MAX_PAGE)
}

export const truncate = (value: string | undefined, max: number) =>
  value ? value.slice(0, max) : undefined

/**
 * Path prefixes that 404 by construction and mean nothing about a broken
 * link — vulnerability scanners probe every public server on the internet
 * for these within minutes of it going live. `http.not_found` (see
 * `server/plugins/signal-errors.ts`) skips them the same way it skips
 * `visitor.class: 'bot'` traffic and asset noise, so the Site Event stays a
 * signal a founder can act on (a campaign link that silently 404s) rather
 * than scanner background noise.
 */
const PROBE_PREFIXES = [
  '/wp-admin', '/wp-login.php', '/wp-content', '/wp-includes', '/wp-json',
  '/xmlrpc.php', '/.env', '/.git', '/phpmyadmin', '/administrator', '/cgi-bin',
]

/**
 * Is a 404 on this request worth an `http.not_found` Site Event?
 *
 * Reuses {@link isPageRequest}'s asset/internal-route filtering (so
 * `/_nuxt/*`, `favicon.ico`, `/api/*`, etc. are already excluded the same way
 * they are for `page_request`), then additionally drops bot traffic and the
 * scanner-probe paths above — neither is "a visitor hit a missing page."
 */
/**
 * Prefix match on a path *segment* boundary — `pathname === prefix` or
 * `pathname.startsWith(prefix + '/')` — so `/wp-admin-consulting` (a real page
 * that merely shares a prefix) doesn't get mistaken for a probe of `/wp-admin`.
 */
const matchesProbe = (pathname: string) =>
  PROBE_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))

export function isNotableNotFound(candidate: PageRequestCandidate, visitorClass?: VisitorClass): boolean {
  if (visitorClass === 'bot') return false
  if (!isPageRequest(candidate)) return false

  const pathname = (candidate.path.split('?')[0] || '/').toLowerCase()
  if (matchesProbe(pathname)) return false

  return true
}

/**
 * Append one `page_request` row for a document GET.
 *
 * Fire-and-forget, exactly like `captureMcpToolCall()`: signal capture must
 * never fail, slow, or change the response a visitor gets. A dropped row costs
 * a data point; a thrown one costs the page.
 */
export function capturePageRequest(event: H3Event): void {
  try {
    const userAgent = getHeader(event, 'user-agent')
    const candidate: PageRequestCandidate = {
      method: event.method,
      path: event.path,
      accept: getHeader(event, 'accept'),
      secFetchDest: getHeader(event, 'sec-fetch-dest'),
      prerender: isPrerenderRequest(event),
    }

    if (!isPageRequest(candidate)) return

    void appendSignal({
      kind: 'event',
      name: 'page_request',
      visitor: describeVisitor(userAgent),
      page: pageFromPath(event.path),
      referrer: truncate(getHeader(event, 'referer'), MAX_REFERRER),
      data: {
        userAgent: truncate(userAgent, MAX_USER_AGENT) ?? null,
        // Additive field, no schema migration needed (`data` is a free-form
        // bag). Lets a consumer compute the agent-native-document share of
        // page_request without guessing format back out of `page`; see
        // AGENTS.md's page_request table.
        format: pageRequestFormat(candidate),
      },
    }, event).catch(() => {
      // Buffer append failed — never surfaces to the visitor.
    })
  }
  catch {
    // Same for a synchronous throw (no storage mounted, no request context).
  }
}

/**
 * True while the request is Nitro prerendering the site rather than a visitor
 * fetching it. `import.meta.prerender` is the build-time flag; the header is set
 * by the prerenderer on each crawled route and covers the runtime case.
 */
function isPrerenderRequest(event: H3Event): boolean {
  if (import.meta.prerender) return true
  return getHeader(event, 'x-nitro-prerender') !== undefined
}
