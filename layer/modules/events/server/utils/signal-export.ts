import { MAX_EXPORT_LIMIT } from './signal-buffer'
import type { SignalBufferSnapshot, SignalReadResult } from './signal-buffer'
import type { SignalExportResponse } from '../../runtime/types/signal'

export interface ExportAuthFailure {
  ok: false
  status: 401 | 503
  message: string
  why: string
  fix: string
}

export type ExportAuthResult = { ok: true } | ExportAuthFailure

/**
 * Bearer-token check for the signal export endpoint. Never open by default:
 * an unconfigured token is a 503, not a free pass.
 */
export function checkExportAuth(
  authHeader: string | undefined,
  configuredToken: string | undefined,
): ExportAuthResult {
  if (!configuredToken) {
    return {
      ok: false,
      status: 503,
      message: 'Signal export is not configured',
      why: 'runtimeConfig.signalExportToken is empty, so the export endpoint stays closed',
      fix: 'Set NUXT_SIGNAL_EXPORT_TOKEN to a random secret and restart the server',
    }
  }

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : ''

  if (!token || token !== configuredToken) {
    return {
      ok: false,
      status: 401,
      message: 'Unauthorized',
      why: token ? 'Bearer token did not match signalExportToken' : 'Missing Authorization: Bearer <token> header',
      fix: 'Send Authorization: Bearer <NUXT_SIGNAL_EXPORT_TOKEN>',
    }
  }

  return { ok: true }
}

export interface ExportParams {
  since: number
  limit: number
}

/** `?since=<seq>&limit=<n≤2000>` — clamped, never NaN. */
export function parseExportParams(query: Record<string, unknown>): ExportParams {
  const toInt = (value: unknown, fallback: number) => {
    const parsed = Number.parseInt(String(value ?? ''), 10)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return {
    since: Math.max(0, toInt(query.since, 0)),
    limit: Math.min(Math.max(1, toInt(query.limit, 100)), MAX_EXPORT_LIMIT),
  }
}

/**
 * The export body. `rows` / `cursor` / `site` are the original contract and
 * stay as they were; `epoch` and `meta` are additive.
 */
export function buildExportResponse(
  page: SignalReadResult,
  site: string,
  snapshot: SignalBufferSnapshot,
): SignalExportResponse {
  return { rows: page.rows, cursor: page.cursor, site, epoch: snapshot.epoch, meta: snapshot.meta }
}
