// Shared helpers for the smoke runners (scripts/smoke.mjs, scripts/browser-smoke.mjs).
// Plain Node 22 — no dependencies.

import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export const SMOKE_UA = 'FoundrySmoke/1.0 (+https://github.com/incubrain/foundry)'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

/** `--key=value` and bare `--flag` options plus positionals. */
export function parseArgs(argv) {
  const positionals = []
  const flags = {}
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=')
      if (eq === -1) flags[arg.slice(2)] = true
      else flags[arg.slice(2, eq)] = arg.slice(eq + 1)
    }
    else positionals.push(arg)
  }
  return { positionals, flags }
}

/** Normalise the CLI base URL: add a scheme if missing, drop path/query/hash. */
export function normaliseBaseUrl(raw) {
  if (!raw) return null
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`
  try {
    const url = new URL(withScheme)
    return url.origin
  }
  catch {
    return null
  }
}

export function isLocalHost(hostname) {
  return LOCAL_HOSTS.has(hostname) || hostname.endsWith('.localhost')
}

/** `localhost-3000`, `foundry.incubrain.org` — safe for a file name. */
export function hostSlug(baseUrl) {
  return new URL(baseUrl).host.replace(/[^a-z0-9.-]+/gi, '-')
}

/** yyyymmddThhmmss (UTC). */
export function stamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, '')
}

/** Run `fn` over `items` with at most `limit` in flight; results keep input order. */
export async function mapPool(items, limit, fn) {
  const results = Array.from({ length: items.length })
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const index = next++
      results[index] = await fn(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

/** Decode the five XML entities that show up in sitemap <loc> values. */
export function decodeXml(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, '\'')
    .replace(/&amp;/g, '&')
}

export function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]*)<\/loc>/gi)].map(match => decodeXml(match[1].trim())).filter(Boolean)
}

/** Remove regions whose text must not count as markup (scripts, styles, comments). */
export function stripInert(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
}

/** Decode the numeric and common named HTML entities that show up in headings/titles. */
function decodeHtmlEntities(text) {
  return decodeXml(text)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&nbsp;/g, ' ')
}

export function stripTags(html) {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

/** Visible text of every <h1> in the markup (inert regions excluded). */
export function extractH1s(html) {
  return [...stripInert(html).matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(match => stripTags(match[1]))
}

export function extractTitle(html) {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)
  return match ? stripTags(match[1]) : ''
}

/** Truncate for report/summary display. */
export function clip(value, max = 90) {
  const raw = typeof value === 'string' ? value : JSON.stringify(value)
  if (raw == null) return String(raw)
  const text = raw.replace(/\s+/g, ' ').trim()
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

/** GET/POST with timeout; never throws — a network failure is `{ error }`. */
export async function request(url, { method = 'GET', headers = {}, body, timeoutMs = 20_000 } = {}) {
  const started = performance.now()
  try {
    const res = await fetch(url, {
      method,
      headers: { 'user-agent': SMOKE_UA, ...headers },
      body,
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    })
    const text = await res.text()
    return {
      status: res.status,
      headers: res.headers,
      contentType: (res.headers.get('content-type') || '').toLowerCase(),
      text,
      finalUrl: res.url,
      ms: Math.round(performance.now() - started),
    }
  }
  catch (error) {
    return {
      status: 0,
      headers: new Headers(),
      contentType: '',
      text: '',
      finalUrl: url,
      error: error?.name === 'TimeoutError' ? `timeout after ${timeoutMs}ms` : String(error?.cause?.code || error?.message || error),
      ms: Math.round(performance.now() - started),
    }
  }
}

export function tryJson(text) {
  try {
    return JSON.parse(text)
  }
  catch {
    return undefined
  }
}

/** Collects check results: `{ id, name, status: pass|warn|fail|skip, expected, actual, ms, details }`. */
export class Recorder {
  constructor() {
    this.checks = []
  }

  add(id, name, status, expected, actual, extra = {}) {
    const check = { id, name, status, expected, actual, ...extra }
    this.checks.push(check)
    return check
  }

  counts() {
    const out = { pass: 0, warn: 0, fail: 0, skip: 0 }
    for (const check of this.checks) out[check.status] += 1
    return out
  }
}

/** Write `data` as JSON under `<cwd>/logs/smoke/<relative>`, creating directories. */
export async function writeLog(relative, data) {
  const file = resolve(process.cwd(), 'logs', 'smoke', relative)
  await mkdir(resolve(file, '..'), { recursive: true })
  await writeFile(file, typeof data === 'string' ? data : `${JSON.stringify(data, null, 2)}\n`)
  return file
}
