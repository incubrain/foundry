import { consola } from 'consola'
import { buildBootReport } from '../utils/boot-report'
import { resolveSignalEnv } from '../utils/signal-env'
import { appendSignal, readSignalSnapshot } from '../utils/signal-buffer'

/**
 * Startup report: one consola line saying what this process is configured as,
 * a warning per production misconfiguration, and one `site_booted` Site Event.
 *
 * The event is the other half of the epoch: a restart on the memory driver
 * restarts `seq`, and this row is the in-stream marker a consumer can find the
 * boundary by. Registered after `signal-storage` (see `index.ts`) so the
 * `signals` mount — and with it the driver — is settled before it is read.
 *
 * Fire-and-forget: a failed report is logged and dropped, never a failed boot.
 */
export default defineNitroPlugin(() => {
  // `nuxt generate` boots this server only to render pages — that is not a deploy.
  if (import.meta.prerender) return
  void report()
})

async function report(): Promise<void> {
  const log = consola.withTag('foundry')
  try {
    const config = useRuntimeConfig()
    const { epoch, meta } = await readSignalSnapshot()

    const { line, warnings, row } = buildBootReport({
      version: (useAppConfig().foundry as { version?: string } | undefined)?.version,
      buildId: (config.app as { buildId?: string } | undefined)?.buildId,
      siteId: config.public.siteId as string | undefined,
      driver: meta.driver,
      dir: process.env.NUXT_SIGNAL_STORE_DIR,
      capacity: meta.capacity,
      retentionDays: meta.retentionDays,
      exportTokenSet: Boolean(config.signalExportToken),
      envMarker: resolveSignalEnv({
        isDev: import.meta.dev,
        configuredEnv: config.public.signalEnv as string | undefined,
      }),
      epoch,
      production: process.env.NODE_ENV === 'production',
    })

    log.info(line)
    for (const warning of warnings) log.warn(warning)

    await appendSignal(row)
  }
  catch (error) {
    log.warn(`boot report failed: ${String((error as Error)?.message ?? error)}`)
  }
}
