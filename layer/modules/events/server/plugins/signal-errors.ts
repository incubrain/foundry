import { appendSignal } from '../utils/signal-buffer'
import { describeVisitor } from '../utils/visitor-class'
import {
  allowRejectionRow,
  ensureRequestId,
  isIngestRejection,
  isNotableNotFound,
  pageFromPath,
  readRejectionIssues,
  truncate,
} from '../utils/page-request'
import type { PageRequestCandidate } from '../utils/page-request'

const MAX_MESSAGE = 300
const MAX_STACK = 1000
const MAX_REFERRER = 512

/** Request errors → the same signal stream as analytics events. */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, ctx) => {
    const err = error as Error & { statusCode?: number, data?: unknown }
    const status = typeof err?.statusCode === 'number' ? err.statusCode : undefined
    const event = ctx.event

    // A crashed request may not always carry a User-Agent header — leave
    // `visitor` unset rather than guess when there's nothing to classify.
    const userAgent = event ? getHeader(event, 'user-agent') : undefined
    const visitor = userAgent ? describeVisitor(userAgent) : undefined
    const requestId = event ? ensureRequestId(event) : undefined

    // A client error is the caller's problem, never a server crash: no
    // `server_error` row for any status below 500. An unauthenticated probe of
    // `/api/_signals/export` (401) used to land ~288 rows/site/day here
    // (product-validator-g58). The two exceptions below are the rows a
    // founder can act on.
    if (status !== undefined && status < 500) {
      if (!event) return

      // A 404 isn't a server error — it's the catch-all page
      // (`layer/app/pages/[...slug].vue`) doing exactly what it should. Report
      // it as its own Site Event, so Polaris can spot a campaign link silently
      // landing on a missing page (product-validator-ev2.6) without every
      // scanner probe inflating the error-log stream.
      if (status === 404) {
        const candidate: PageRequestCandidate = {
          method: event.method,
          path: event.path,
          accept: getHeader(event, 'accept'),
          secFetchDest: getHeader(event, 'sec-fetch-dest'),
        }

        if (isNotableNotFound(candidate, visitor?.class)) {
          void appendSignal({
            kind: 'event',
            name: 'http.not_found',
            page: pageFromPath(event.path),
            referrer: truncate(getHeader(event, 'referer'), MAX_REFERRER),
            visitor,
            data: { requestId },
          }, event).catch(() => {})
        }
        return
      }

      // A refused capture POST (bad JSON, failed validation, too large) means a
      // tracker is silently losing rows. Handlers throw — they never append —
      // and the one row is written here, rate-limited so a client retrying in
      // a loop leaves one row a minute, not thousands.
      const path = pageFromPath(event.path)
      if (isIngestRejection(event.method, path, status) && allowRejectionRow(path, status)) {
        void appendSignal({
          kind: 'log',
          severity: 'warning',
          name: 'ingest_rejected',
          visitor,
          data: { requestId, path, status, issues: readRejectionIssues(err.data) },
        }, event).catch(() => {})
      }
      return
    }

    void appendSignal({
      kind: 'log',
      severity: 'error',
      name: 'server_error',
      page: event?.path,
      visitor,
      data: {
        message: String(err?.message ?? err).slice(0, MAX_MESSAGE),
        stack: err?.stack?.slice(0, MAX_STACK),
        statusCode: err?.statusCode,
        ...(event ? { requestId, method: event.method, path: pageFromPath(event.path), status: status ?? 500 } : {}),
      },
    }, event).catch(() => {})
  })
})
