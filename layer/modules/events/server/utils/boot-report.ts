import type { SignalInput } from '../../runtime/types/signal'

export interface BootReportInput {
  version: string | undefined
  buildId: string | undefined
  siteId: string | undefined
  /** `'memory'` or `'fs'`, as reported by the signals buffer. */
  driver: string
  /** `NUXT_SIGNAL_STORE_DIR`; only meaningful on the `fs` driver. */
  dir: string | undefined
  capacity: number
  retentionDays: number
  exportTokenSet: boolean
  /** `resolveSignalEnv()` result: `'local'` or nothing. */
  envMarker: 'local' | undefined
  epoch: string
  /** `NODE_ENV === 'production'` — the only mode the misconfiguration warnings fire in. */
  production: boolean
}

export interface BootReport {
  /** The single startup line. */
  line: string
  /** One per misconfiguration, production only. */
  warnings: string[]
  /** The `site_booted` Site Event. */
  row: SignalInput
}

/**
 * Pure builder for the startup report (`server/plugins/site-booted.ts`), so the
 * line, the warnings and the Site Event can be pinned without a Nitro server.
 *
 * The three warnings are the three ways a deployed site silently stops being a
 * usable signal source: no `siteId` (rows are stamped with whatever host the
 * request used), the memory driver (every restart restarts `seq` and drops
 * whatever Polaris had not pulled yet), and no export token (nothing can pull).
 * They only fire under `NODE_ENV=production` — dev and tests run all three on
 * purpose.
 */
export function buildBootReport(input: BootReportInput): BootReport {
  const siteIdSet = Boolean(input.siteId)
  const memory = input.driver === 'memory'

  const driver = input.driver === 'fs' && input.dir ? `fs(${input.dir})` : input.driver
  const line = [
    `v${input.version || 'unknown'} booted`,
    `site=${input.siteId || 'UNSET'}`,
    `driver=${driver}`,
    `capacity=${input.capacity}`,
    `retention=${input.retentionDays}d`,
    `exportToken=${input.exportTokenSet ? 'yes' : 'no'}`,
    `env=${input.envMarker ?? 'none'}`,
    `epoch=${input.epoch}`,
  ].join(' ')

  const warnings: string[] = []
  if (input.production) {
    if (!siteIdSet) {
      warnings.push('NUXT_PUBLIC_SITE_ID is UNSET — rows are stamped with the request host, so the site is not identifiable. Set it.')
    }
    if (memory) {
      warnings.push('signals buffer is in-memory — every restart restarts seq at 1 and drops rows nobody has pulled yet. Set NUXT_SIGNAL_STORE_DIR to a persistent volume.')
    }
    if (!input.exportTokenSet) {
      warnings.push('NUXT_SIGNAL_EXPORT_TOKEN is unset — /api/_signals/export answers 503, so nothing can pull this site\'s signals. Set it.')
    }
  }

  return {
    line,
    warnings,
    row: {
      kind: 'log',
      name: 'site_booted',
      severity: 'info',
      data: {
        version: input.version || '',
        buildId: input.buildId || null,
        driver: input.driver,
        epoch: input.epoch,
        siteIdSet,
        exportTokenSet: input.exportTokenSet,
      },
    },
  }
}
