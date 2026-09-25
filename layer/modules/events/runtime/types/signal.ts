/**
 * Signal envelope — ONE shape for everything a Foundry site captures.
 *
 * Analytics events and error/warning logs share this row. Rows land in a capped
 * server-side ring buffer and are pulled by an external consumer (Polaris) via
 * `GET /api/_signals/export`.
 */

import type { AiAgentPurpose } from '../../../../shared/ai-agents'

export type SignalKind = 'event' | 'log'
export type SignalSeverity = 'error' | 'warning'
export type VisitorClass = 'human' | 'agent' | 'bot'
export type VisitorDevice = 'mobile' | 'tablet' | 'desktop'

/**
 * What an `agent`'s fetch is for. **Additive** to `class`, never a replacement:
 * `class` stays a stable three-value enum because external consumers (Polaris)
 * already group exported rows on it, and widening that enum would silently
 * reclassify historical traffic. A consumer that knows nothing about `subclass`
 * keeps working; one that does can split agent traffic by intent.
 *
 * Owned by the shared AI taxonomy (`layer/shared/ai-agents.ts`) — the same
 * grouping robots.txt is generated from.
 */
export type VisitorSubclass = AiAgentPurpose

export interface SignalVisitor {
  /**
   * Cookieless visitor identity: `sha256(daily_salt + site + ip + user_agent)`,
   * truncated, stamped server-side in `appendSignal()` (see
   * `server/utils/visitor-hash.ts`). Stable for one visitor within a UTC day,
   * unlinkable across days. Replaced the client-stored `anonId`
   * (decision product-validator-ev2.1) — rows from before the cutover carry
   * `anonId` instead. Client-supplied values are never trusted.
   */
  hash?: string
  /**
   * Stamped server-side from the request User-Agent at ingest/append time
   * (see `server/utils/visitor-class.ts`). Client-supplied values are never
   * trusted. Left unset only when no User-Agent was available to classify
   * (e.g. a Nitro error hook with no request context).
   */
  class?: VisitorClass
  /**
   * Agent sub-class. Only ever set when `class === 'agent'` **and** the UA
   * matched a published token whose purpose is known — an agent recognised only
   * by a loose vendor substring (`AI_VENDOR_HINTS`) carries no subclass, because
   * the vendor does not tell you what the fetch was for.
   */
  subclass?: VisitorSubclass
  /**
   * `device` / `browser` / `os` — stamped server-side in `appendSignal()` from
   * the request User-Agent (see `server/utils/visitor-device.ts`). Family names
   * only (`'Chrome'`, `'iOS'`), never versions. Unset for crawlers, bare HTTP
   * clients and anything else that isn't a browser on a mobile/tablet/desktop.
   */
  device?: VisitorDevice
  browser?: string
  os?: string
}

export interface SignalRow {
  id: string
  /** Monotonic cursor. Assigned by the buffer on append. */
  seq: number
  ts: number
  site: string
  kind: SignalKind
  name: string
  severity?: SignalSeverity
  visitor?: SignalVisitor
  page?: string
  referrer?: string
  utm?: Record<string, string>
  /**
   * Review-session tag, from a `?polaris_review=<token>` query param on the
   * page the event was emitted from. Its own top-level field — never squatted
   * into `utm` — and deliberately NOT persisted: only rows emitted during that
   * one page load carry it, which is all an external reviewer needs to bind the
   * tag to a `visitor.hash`. See `pageContext()` in `runtime/utils/signal.ts`.
   */
  review?: string
  data?: Record<string, unknown>
  /**
   * Local/debug marker. `'local'` when the row was produced by a dev-mode (or
   * explicitly marked) server; **absent** otherwise. Additive on purpose —
   * Polaris stores rows verbatim and its contract is "absent when it does not
   * apply", so a production row must never carry this key (zero migration for
   * existing consumers). Stamped once, server-side, in `appendSignal()`
   * (`server/utils/signal-buffer.ts`), from `resolveSignalEnv()`
   * (`server/utils/signal-env.ts`) — see that file for the precedence rule and
   * `AGENTS.md`'s "Local debugging against Polaris" note.
   */
  env?: 'local'
}

/** What callers hand to `appendSignal()` — the buffer fills in `seq`/`id`/`ts`/`site`. */
export type SignalInput
  = Omit<SignalRow, 'seq' | 'id' | 'ts' | 'site'>
    & Partial<Pick<SignalRow, 'id' | 'ts' | 'site'>>

export interface SignalExportResponse {
  rows: SignalRow[]
  cursor: number
  site: string
}
