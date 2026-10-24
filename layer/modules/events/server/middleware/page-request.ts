import { capturePageRequest, ensureRequestId } from '../utils/page-request'

/**
 * Every request gets a request id; every document GET also → one `page_request`
 * signal row.
 *
 * Registered as Nitro middleware so it sees requests that never reach a Vue
 * component — a crawler's plain GET, a no-JS browser, a curl — and, for the id,
 * every `/api` and `/mcp` request too. The id (`event.context.foundryRequestId`,
 * echoed as the `x-request-id` response header) is what links the rows one
 * request produced. All the filtering and the fire-and-forget append live in
 * `utils/page-request.ts`; this file is only the mount point.
 *
 * Returns nothing and awaits nothing: the middleware must not add latency to,
 * or be able to fail, the request it is observing.
 */
export default defineEventHandler((event) => {
  ensureRequestId(event)
  capturePageRequest(event)
})
