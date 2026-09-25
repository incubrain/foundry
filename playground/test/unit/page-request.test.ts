import { describe, it, expect } from 'vitest'
import {
  isNotableNotFound,
  isPageRequest,
  pageFromPath,
  pageRequestFormat,
} from '@incubrain/foundry/modules/events/server/utils/page-request'

/** A bare crawler GET: no Sec-Fetch-Dest, wildcard Accept. */
const crawlerGet = (path: string) => ({
  method: 'GET',
  path,
  accept: '*/*',
})

/** A real browser navigating: Sec-Fetch-Dest is authoritative. */
const browserNavigation = (path: string) => ({
  method: 'GET',
  path,
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  secFetchDest: 'document',
})

describe('isPageRequest', () => {
  it('accepts a crawler GET for a page', () => {
    expect(isPageRequest(crawlerGet('/'))).toBe(true)
    expect(isPageRequest(crawlerGet('/pricing'))).toBe(true)
    expect(isPageRequest(crawlerGet('/docs/getting-started'))).toBe(true)
  })

  it('accepts a browser document navigation', () => {
    expect(isPageRequest(browserNavigation('/pricing'))).toBe(true)
  })

  it('accepts a GET with no Accept header at all', () => {
    expect(isPageRequest({ method: 'GET', path: '/pricing' })).toBe(true)
  })

  it('keeps the query string out of the decision', () => {
    expect(isPageRequest(crawlerGet('/pricing?utm_source=chatgpt'))).toBe(true)
  })

  it('accepts a prerendered .html page path', () => {
    expect(isPageRequest(crawlerGet('/about.html'))).toBe(true)
  })

  it('rejects anything that is not a GET', () => {
    for (const method of ['POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS']) {
      expect(isPageRequest({ ...crawlerGet('/pricing'), method }), method).toBe(false)
    }
  })

  it('rejects API and internal routes', () => {
    const paths = [
      '/api/v1/webhook',
      '/api/_signals/export',
      '/api/_signals/ingest',
      '/api/_health',
      '/api/_foundry/content/page',
      '/_signals/export',
      '/_health',
      '/.well-known/security.txt',
      '/_vercel/insights/view',
    ]

    for (const path of paths) expect(isPageRequest(crawlerGet(path)), path).toBe(false)
  })

  it('rejects build-output and dev-server routes', () => {
    const paths = [
      '/_nuxt/entry.abc123.js',
      '/_nuxt/builds/meta/dev.json',
      '/__nuxt_island/Foo',
      '/_ipx/w_640/img/hero.png',
      '/_scripts/abc.js',
      '/@vite/client',
      '/@id/virtual:nuxt',
      '/@fs/Users/x/project/app.vue',
      '/node_modules/.vite/deps/vue.js',
    ]

    for (const path of paths) expect(isPageRequest(crawlerGet(path)), path).toBe(false)
  })

  it('rejects assets by extension', () => {
    const paths = [
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
      '/img/hero.png',
      '/styles/main.css',
      '/bundle.js.map',
      '/fonts/inter.woff2',
      '/feed.rss',
    ]

    for (const path of paths) expect(isPageRequest(crawlerGet(path)), path).toBe(false)
  })

  it('accepts a `.md` content route (product-validator-m0f.15)', () => {
    expect(isPageRequest(crawlerGet('/blog/post.md'))).toBe(true)
    expect(isPageRequest(crawlerGet('/docs/getting-started.md'))).toBe(true)
  })

  it('accepts a canonical route negotiated with `Accept: text/markdown`', () => {
    expect(isPageRequest({ method: 'GET', path: '/blog/post', accept: 'text/markdown' }))
      .toBe(true)
    expect(isPageRequest({
      method: 'GET',
      path: '/blog/post',
      accept: 'text/markdown, text/html;q=0.5',
    })).toBe(true)
  })

  it('accepts /llms.txt and /llms-full.txt (product-validator-m0f.15)', () => {
    expect(isPageRequest(crawlerGet('/llms.txt'))).toBe(true)
    expect(isPageRequest(crawlerGet('/llms-full.txt'))).toBe(true)
  })

  it('still rejects an unrelated .txt asset', () => {
    expect(isPageRequest(crawlerGet('/security.txt'))).toBe(false)
    expect(isPageRequest(crawlerGet('/changelog.txt'))).toBe(false)
  })

  it('rejects non-document fetches from a real browser', () => {
    const dests = ['script', 'style', 'image', 'font', 'empty', 'manifest']

    for (const secFetchDest of dests) {
      expect(isPageRequest({ ...browserNavigation('/pricing'), secFetchDest }), secFetchDest)
        .toBe(false)
    }
  })

  it('accepts an iframe embed as a document', () => {
    expect(isPageRequest({ ...browserNavigation('/pricing'), secFetchDest: 'iframe' })).toBe(true)
  })

  it('rejects a data fetch that asks for JSON only', () => {
    expect(isPageRequest({ method: 'GET', path: '/pricing', accept: 'application/json' }))
      .toBe(false)
  })

  it('rejects prerender-build traffic', () => {
    expect(isPageRequest({ ...crawlerGet('/pricing'), prerender: true })).toBe(false)
  })
})

describe('pageRequestFormat', () => {
  it('labels a `.md` suffix as markdown', () => {
    expect(pageRequestFormat(crawlerGet('/blog/post.md'))).toBe('markdown')
  })

  it('labels /llms.txt and /llms-full.txt as markdown', () => {
    expect(pageRequestFormat(crawlerGet('/llms.txt'))).toBe('markdown')
    expect(pageRequestFormat(crawlerGet('/llms-full.txt'))).toBe('markdown')
  })

  it('labels an Accept: text/markdown negotiated fetch as markdown', () => {
    expect(pageRequestFormat({ method: 'GET', path: '/blog/post', accept: 'text/markdown' }))
      .toBe('markdown')
  })

  it('labels an ordinary page as html', () => {
    expect(pageRequestFormat(crawlerGet('/pricing'))).toBe('html')
    expect(pageRequestFormat(browserNavigation('/pricing'))).toBe('html')
  })
})

describe('isNotableNotFound', () => {
  it('accepts a 404 on an ordinary page path', () => {
    expect(isNotableNotFound(crawlerGet('/blog/deleted-post'))).toBe(true)
  })

  it('accepts a 404 for agent traffic (only bot is excluded)', () => {
    expect(isNotableNotFound(crawlerGet('/blog/deleted-post'), 'agent')).toBe(true)
    expect(isNotableNotFound(crawlerGet('/blog/deleted-post'), 'human')).toBe(true)
  })

  it('rejects bot traffic', () => {
    expect(isNotableNotFound(crawlerGet('/blog/deleted-post'), 'bot')).toBe(false)
  })

  it('rejects asset and internal-route noise, same as isPageRequest', () => {
    const paths = [
      '/favicon.ico',
      '/_nuxt/entry.abc123.js',
      '/api/_signals/export',
      '/robots.txt',
    ]

    for (const path of paths) expect(isNotableNotFound(crawlerGet(path)), path).toBe(false)
  })

  it('rejects a non-GET', () => {
    expect(isNotableNotFound({ ...crawlerGet('/pricing'), method: 'POST' })).toBe(false)
  })

  it('rejects well-known vulnerability-scanner probes', () => {
    const paths = [
      '/wp-admin',
      '/wp-admin/setup-config.php',
      '/wp-login.php',
      '/wp-content/plugins/x',
      '/wp-json/wp/v2/users',
      '/xmlrpc.php',
      '/.env',
      '/.git/config',
      '/phpmyadmin',
      '/administrator/index.php',
      '/cgi-bin/test.sh',
    ]

    for (const path of paths) expect(isNotableNotFound(crawlerGet(path)), path).toBe(false)
  })

  it('is case-insensitive matching probe prefixes', () => {
    expect(isNotableNotFound(crawlerGet('/WP-ADMIN/setup.php'))).toBe(false)
  })

  it('does not treat a lookalike path as a probe', () => {
    expect(isNotableNotFound(crawlerGet('/wp-admin-consulting'))).toBe(true)
  })
})

describe('pageFromPath', () => {
  it('strips the query string so `page` matches the client convention', () => {
    expect(pageFromPath('/pricing?utm_source=chatgpt&ref=x')).toBe('/pricing')
  })

  it('passes a bare path through', () => {
    expect(pageFromPath('/docs/getting-started')).toBe('/docs/getting-started')
    expect(pageFromPath('/')).toBe('/')
  })

  it('caps a pathological path at the ingest schema limit', () => {
    expect(pageFromPath(`/${'a'.repeat(900)}`)).toHaveLength(512)
  })
})
