import { appendSignal } from '../utils/signal-buffer'
import { describeVisitor } from '../utils/visitor-class'
import { isNotableNotFound, pageFromPath, truncate } from '../utils/page-request'
import type { PageRequestCandidate } from '../utils/page-request'

const MAX_MESSAGE = 500
const MAX_STACK = 1000
const MAX_REFERRER = 512

/** Request errors → the same signal stream as analytics events. */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, ctx) => {
    const err = error as Error & { statusCode?: number }

    // A crashed request may not always carry a User-Agent header — leave
    // `visitor` unset rather than guess when there's nothing to classify.
    const userAgent = ctx.event ? getHeader(ctx.event, 'user-agent') : undefined
    const visitor = userAgent ? describeVisitor(userAgent) : undefined

    // A 404 isn't a server error — it's the catch-all page
    // (`layer/app/pages/[...slug].vue`) doing exactly what it should. Report
    // it as its own Site Event instead of `server_error`, so Polaris can spot
    // a campaign link silently landing on a missing page (product-validator-ev2.6)
    // without every scanner probe inflating the error-log stream.
    if (err?.statusCode === 404 && ctx.event) {
      const candidate: PageRequestCandidate = {
        method: ctx.event.method,
        path: ctx.event.path,
        accept: getHeader(ctx.event, 'accept'),
        secFetchDest: getHeader(ctx.event, 'sec-fetch-dest'),
      }

      if (isNotableNotFound(candidate, visitor?.class)) {
        void appendSignal({
          kind: 'event',
          name: 'http.not_found',
          page: pageFromPath(ctx.event.path),
          referrer: truncate(getHeader(ctx.event, 'referer'), MAX_REFERRER),
          visitor,
        }, ctx.event).catch(() => {})
      }
      return
    }

    void appendSignal({
      kind: 'log',
      severity: 'error',
      name: 'server_error',
      page: ctx.event?.path,
      visitor,
      data: {
        message: String(err?.message ?? err).slice(0, MAX_MESSAGE),
        stack: err?.stack?.slice(0, MAX_STACK),
        statusCode: err?.statusCode,
      },
    }, ctx.event).catch(() => {})
  })
})
