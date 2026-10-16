/**
 * Which request shapes can hand out a blog post's source outside the pages?
 * Pure so it is unit-testable; the middleware turns the answer into a 404.
 *
 * - `/raw<prefix>/<slug>.md` — @nuxt/content's own raw-markdown route (every page collection)
 * - `<prefix>/<slug>.md`     — the markdown-rewrite suffix form
 * - `/api/_foundry/content/page?collection=blog&path=…` — the layer's generic page endpoint
 * - `/api/_foundry/content/surround?collection=blog` — prev/next would name unpublished posts
 *
 * Returns the content path to check, `'deny'`, or `null` for an unrelated request.
 */
export function guardTarget(
  pathname: string,
  query: Record<string, unknown>,
  prefix: string,
): string | 'deny' | null {
  if (pathname === '/api/_foundry/content/page' && query.collection === 'blog') {
    return typeof query.path === 'string' ? query.path.replace(/\/+$/, '') || '/' : 'deny'
  }
  if (pathname === '/api/_foundry/content/surround' && query.collection === 'blog') return 'deny'

  const clean = prefix.replace(/\/+$/, '')
  const rest = pathname.startsWith(`/raw${clean}/`)
    ? pathname.slice(`/raw${clean}/`.length)
    : pathname.startsWith(`${clean}/`) && pathname.endsWith('.md')
      ? pathname.slice(`${clean}/`.length)
      : null
  if (!rest?.endsWith('.md')) return null

  try {
    return `${clean}/${decodeURIComponent(rest.slice(0, -3))}`
  }
  catch {
    return 'deny'
  }
}
