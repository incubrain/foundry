/** Which Site Event buffer this process is writing to — lineage only, never volume. */
export interface HealthSignals {
  /** `'memory'` (a restart loses unpulled rows and restarts `seq`) or `'fs'`. */
  driver: string
  /** Same value as `epoch` on `GET /api/_signals/export`; `null` if the buffer could not be read. */
  epoch: string | null
}

export interface HealthResponse {
  ok: true
  service: 'foundry'
  version: string
  siteId: string | null
  timestamp: string
  /** Nuxt app buildId — changes on every build, so a deploy is visible without reading rows. */
  buildId?: string | null
  /** Absent when signal capture is disabled. */
  signals?: HealthSignals
}

export interface HealthExtras {
  buildId?: string | null
  signals?: HealthSignals
}

/**
 * Pure payload builder for `GET /api/_health`. Kept free of Nitro/H3 globals
 * (`useAppConfig`, `useRuntimeConfig`) so it is unit-testable without a
 * running server — the route handler resolves those and passes plain values.
 *
 * `extras` are additive: a key appears only when the caller supplies it, so the
 * original five keys never change shape.
 */
export function buildHealthPayload(
  version: string | undefined,
  siteId: string | undefined,
  now: Date = new Date(),
  extras: HealthExtras = {},
): HealthResponse {
  return {
    ok: true,
    service: 'foundry',
    version: version || '',
    siteId: siteId || null,
    timestamp: now.toISOString(),
    ...(extras.buildId !== undefined ? { buildId: extras.buildId || null } : {}),
    ...(extras.signals ? { signals: extras.signals } : {}),
  }
}
