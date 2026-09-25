import Bowser from 'bowser'
import type { VisitorDevice } from '../../runtime/types/signal'

/**
 * `visitor.device` / `visitor.browser` / `visitor.os` — server-side, from the
 * request User-Agent. Family names only, never versions: a version string adds
 * fingerprinting surface and no analytics feature needs it.
 *
 * Parsed with `bowser` (MIT, ships its own types, ~8 KB gzipped, server bundle
 * only). `ua-parser-js` was the first candidate, but v2 is AGPL and v1 ships no
 * types; bowser also reports `desktop` directly where ua-parser-js leaves the
 * device type blank.
 *
 * Only a UA bowser places on a mobile, tablet or desktop platform is described.
 * Crawlers (`bot` platform), TVs, and bare HTTP clients get nothing — they are
 * not a browser on a device, and `visitor.class` already says what they are.
 */

const DEVICES = new Set<string>(['mobile', 'tablet', 'desktop'])
const MAX_NAME = 64

export interface VisitorDeviceInfo {
  device?: VisitorDevice
  browser?: string
  os?: string
}

export function describeDevice(userAgent: string | undefined | null): VisitorDeviceInfo {
  const ua = userAgent?.trim()
  if (!ua) return {}

  const { platform, browser, os } = Bowser.parse(ua)
  if (!platform.type || !DEVICES.has(platform.type)) return {}

  return {
    device: platform.type as VisitorDevice,
    ...(browser.name ? { browser: browser.name.slice(0, MAX_NAME) } : {}),
    ...(os.name ? { os: os.name.slice(0, MAX_NAME) } : {}),
  }
}
