import { buildHealthPayload, type HealthResponse, type HealthSignals } from '../utils/health'
import { readSignalIdentity } from '../../modules/events/server/utils/signal-buffer'

async function signalsBlock(): Promise<HealthSignals> {
  try {
    return await readSignalIdentity()
  }
  catch {
    return { driver: 'unknown', epoch: null }
  }
}

/**
 * GET /api/_health — cheap liveness + identity check for external monitors
 * (Polaris). No auth, so nothing here may carry traffic: build-time config plus
 * the buffer's driver and epoch (lineage, not volume). The epoch is memoised
 * after the first read — this never scans rows and, once the boot report has
 * run, touches no storage at all. A broken signal buffer degrades the
 * `signals` block, never the endpoint.
 */
export default defineEventHandler(async (event): Promise<HealthResponse> => {
  setHeader(event, 'Cache-Control', 'no-store')

  const foundry = useAppConfig().foundry as { version?: string } | undefined
  const config = useRuntimeConfig(event)
  const siteId = config.public.siteId as string | undefined
  const buildId = (config.app as { buildId?: string } | undefined)?.buildId

  // `runtimeConfig.signals` only exists while signal capture is enabled.
  const signals = config.signals ? await signalsBlock() : undefined

  return buildHealthPayload(foundry?.version, siteId, new Date(), { buildId: buildId ?? null, signals })
})
