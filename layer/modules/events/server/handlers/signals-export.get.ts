import { readSignals, readSignalSnapshot, resolveSite } from '../utils/signal-buffer'
import { buildExportResponse, checkExportAuth, parseExportParams } from '../utils/signal-export'
import type { SignalExportResponse } from '../../runtime/types/signal'

/**
 * GET /api/_signals/export?since=<seq>&limit=<n≤2000>
 * Cursor-based pull for external consumers (Polaris). Bearer auth required.
 *
 * `epoch` + `meta` ride along on every page (token-gated — `meta` carries
 * traffic volume): the epoch says which buffer the cursor belongs to, so a
 * consumer can tell a producer restart from a quiet site.
 */
export default defineEventHandler(async (event): Promise<SignalExportResponse> => {
  const config = useRuntimeConfig(event)

  const auth = checkExportAuth(
    getHeader(event, 'authorization'),
    config.signalExportToken as string | undefined,
  )

  if (!auth.ok) {
    throw createError({
      statusCode: auth.status,
      statusMessage: `${auth.message}: ${auth.why}`,
    })
  }

  const { since, limit } = parseExportParams(getQuery(event))
  const [page, snapshot] = await Promise.all([
    readSignals(since, limit),
    readSignalSnapshot(),
  ])

  return buildExportResponse(page, resolveSite(event), snapshot)
})
