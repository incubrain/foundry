// server/utils/cache.ts
export function escapeKey(key: string | string[]) {
  return String(key).replace(/\W/g, '')
}

/**
 * Nitro cached function key:
 * `nitro:functions:<name>:<normalizedKey>.json`
 */
export function nitroFunctionCacheKey(name: string, key: string) {
  const normalized = escapeKey(key)
  return `nitro:functions:${name}:${normalized}.json`
}

/**
 * Nitro cached handler key (if you used defineCachedEventHandler):
 * `nitro:handlers:<name>:<normalizedKey>.json`
 */
export function nitroHandlerCacheKey(name: string, key: string) {
  const normalized = escapeKey(key)
  return `nitro:handlers:${name}:${normalized}.json`
}
