#!/usr/bin/env node
// Browser smoke runner for any Foundry site (playwright-core + Chrome).
//
//   pnpm smoke:browser <baseUrl> [--routes=sitemap|/a,/b] [--viewports=desktop,mobile]
//                                [--max-routes=N] [--telemetry=live|stub] [--concurrency=N]
//
// Per route x viewport: console errors/warnings (Hydration flagged), pageerror, failed or
// >=400 responses, mobile horizontal overflow, <h1> count, a full-page screenshot, and a
// telemetry check (a `ui.page` row must reach POST /api/_signals/ingest within 6s of load - of
// hydration on a Vite dev server, which compiles modules on first request).
// On the first route it also clicks every same-origin header nav link.
// Output: logs/smoke/browser-<host>-<ts>/{report.json,summary.md,*.png}. Exit 1 on any
// error-level finding. See docs/debugging.md.

import { homedir } from 'node:os'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright-core'
import {
  SMOKE_UA,
  clip,
  extractLocs,
  hostSlug,
  isLocalHost,
  mapPool,
  normaliseBaseUrl,
  parseArgs,
  request,
  stamp,
} from './lib/smoke-common.mjs'

const USAGE = 'Usage: pnpm smoke:browser <baseUrl> [--routes=sitemap|/a,/b] [--viewports=desktop,mobile] [--max-routes=N] [--telemetry=live|stub] [--concurrency=N]'
const VIEWPORTS = {
  desktop: { width: 1280, height: 800, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
}
const TELEMETRY_WINDOW_MS = 6000
const NAV_TIMEOUT_MS = 45_000
// Vite dev servers: see `devServer` below.
const DEV_HYDRATION_TIMEOUT_MS = 40_000
const DEV_SETTLE_MS = 500
const INGEST_PATH = '/api/_signals/ingest'

const { positionals, flags } = parseArgs(process.argv.slice(2))
const baseUrl = normaliseBaseUrl(positionals[0])
if (!baseUrl) {
  console.error(USAGE)
  process.exit(2)
}
const base = new URL(baseUrl)
const local = isLocalHost(base.hostname)

const viewportNames = String(flags.viewports || 'desktop,mobile').split(',').map(name => name.trim()).filter(Boolean)
const unknownViewport = viewportNames.find(name => !VIEWPORTS[name])
if (unknownViewport) {
  console.error(`Unknown viewport "${unknownViewport}" (known: ${Object.keys(VIEWPORTS).join(', ')})`)
  process.exit(2)
}
const maxRoutes = flags['max-routes'] ? Math.max(1, Number.parseInt(flags['max-routes'], 10)) : Infinity
const concurrency = Math.max(1, Number.parseInt(flags.concurrency || '3', 10))
const routesArg = String(flags.routes || 'sitemap')

// Remote hosts: the page's own telemetry POSTs would write rows into that site's signal
// store, so they are stubbed unless the operator opts in explicitly.
const telemetryMode = flags.telemetry === 'live' || flags.telemetry === 'stub' ? flags.telemetry : (local ? 'live' : 'stub')
if (telemetryMode === 'live' && !local && process.env.SMOKE_ALLOW_REMOTE_WRITE !== '1') {
  console.error(`Refusing --telemetry=live against ${base.host}: the page would POST rows into that site's signal store.`)
  console.error('Leave the default (stubbed POSTs) or set SMOKE_ALLOW_REMOTE_WRITE=1 for a host you own and may write to.')
  process.exit(2)
}

// -- routes ---------------------------------------------------------------------------------
async function sitemapRoutes() {
  const seen = new Set()
  const paths = []
  const crawl = async (url, depth) => {
    if (seen.has(url) || depth > 2) return
    seen.add(url)
    const res = await request(url, { headers: { accept: 'application/xml,text/xml,*/*' } })
    if (res.status !== 200) return
    const locs = extractLocs(res.text)
    if (/<sitemapindex/i.test(res.text)) {
      for (const loc of locs) await crawl(new URL(new URL(loc).pathname, baseUrl).href, depth + 1)
    }
    else {
      for (const loc of locs) {
        try {
          const parsed = new URL(loc)
          paths.push(parsed.pathname + parsed.search)
        }
        catch { /* skip malformed <loc> */ }
      }
    }
  }
  await crawl(new URL('/sitemap.xml', baseUrl).href, 0)
  return [...new Set(paths)]
}

let routes
let routesNote = ''
if (routesArg === 'sitemap') {
  routes = await sitemapRoutes()
  if (!routes.length) {
    routes = ['/']
    routesNote = 'sitemap.xml gave no URLs — fell back to /'
  }
}
else {
  routes = routesArg.split(',').map(route => route.trim()).filter(Boolean).map(route => (route.startsWith('/') ? route : `/${route}`))
}
routes = routes.slice(0, maxRoutes)

// A Vite dev server (`nuxt dev`) transforms every module the first time it is requested, so on a
// cold server the network stays busy for 10s+ and the app hydrates well after `load` - which
// reads as "network never went idle" and "no ui.page row within 6s" although both are fine on
// a warm server or a build. Detect it once (the document carries the Vite client tag) and wait
// for hydration instead of network idle. Production builds keep the network-idle wait.
const devServer = local && /\/@vite\/client/.test((await request(base.href)).text)

// -- browser --------------------------------------------------------------------------------
async function launchBrowser() {
  const attempts = [
    { label: 'Google Chrome (channel)', options: { channel: 'chrome' } },
    { label: 'Playwright chromium', options: {} },
  ]
  const failures = []
  for (const attempt of attempts) {
    try {
      const browser = await chromium.launch({ headless: true, ...attempt.options })
      return { browser, label: `${attempt.label} ${browser.version()}` }
    }
    catch (error) {
      failures.push(`${attempt.label}: ${String(error.message).split('\n')[0]}`)
    }
  }
  console.error('Could not launch a browser.')
  for (const failure of failures) console.error(`  - ${failure}`)
  console.error(`Install one with: npx playwright-core install chromium-headless-shell  (cache: ${homedir()}/Library/Caches/ms-playwright)`)
  process.exit(2)
}

const started = Date.now()
const { browser, label: browserLabel } = await launchBrowser()
const slug = `browser-${hostSlug(baseUrl)}-${stamp(new Date(started))}`

const routeSlug = route => (route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/gi, '-').slice(0, 60) || 'home')
const sameOrigin = (url) => {
  try {
    return new URL(url).origin === base.origin
  }
  catch {
    return false
  }
}
const describeElement = () => {
  const out = []
  const width = document.documentElement.clientWidth
  const hiddenOverflow = (el) => {
    for (let node = el.parentElement; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
      const overflowX = getComputedStyle(node).overflowX
      if (overflowX !== 'visible') return true
    }
    return false
  }
  for (const el of document.body.querySelectorAll('*')) {
    const rect = el.getBoundingClientRect()
    if (!rect.width || rect.right <= width + 1 || hiddenOverflow(el)) continue
    const classes = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''
    out.push(`${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${classes ? `.${classes}` : ''} (right ${Math.round(rect.right)})`)
    if (out.length >= 3) break
  }
  return out
}

/** Drop `%c` style markers, their CSS tail and ANSI colour codes from a console message. */
function cleanConsole(text) {
  return text
    // eslint-disable-next-line no-control-regex -- ANSI escape sequences
    .replace(/\x1B\[[0-9;]*m/g, '')
    .replace(/%c/g, '')
    .replace(/\s*background:\s*#[0-9a-f]{3,8};(?:\s*[a-z-]+:[^;]+;)*/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Dev-server wait (see `devServer`): hydration finished, plus a short fixed settle for the
 * client plugins' first work. Resolves false when hydration did not finish in time; never throws.
 */
async function waitForDevHydration(page) {
  const hydrated = await page.waitForFunction(() => {
    try {
      return window.useNuxtApp().isHydrating === false
    }
    catch { return false }
  }, undefined, { timeout: DEV_HYDRATION_TIMEOUT_MS, polling: 100 }).then(() => true, () => false)
  await page.waitForTimeout(DEV_SETTLE_MS)
  return hydrated
}

/** Best-effort wait for the app to finish loading and hydrating; never throws. */
async function settle(page) {
  if (devServer) {
    await waitForDevHydration(page)
    return
  }
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForFunction(() => !window.useNuxtApp || !window.useNuxtApp().isHydrating, undefined, { timeout: 5000 }).catch(() => {})
}

/** Wire listeners that record everything the page does into `state`. */
function observe(page, state) {
  page.on('console', (message) => {
    const type = message.type()
    if (type !== 'error' && type !== 'warning') return
    const text = cleanConsole(message.text())
    // The URL and status are reported once by the response listener below.
    if (/^Failed to load resource/i.test(text)) return
    state.console.push({ type, text, location: message.location()?.url || '' })
  })
  page.on('pageerror', error => state.pageErrors.push(String(error?.message || error)))
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText || 'failed'
    if (/ERR_ABORTED/.test(failure)) return
    state.failedRequests.push({ url: request.url(), failure })
  })
  page.on('response', (response) => {
    if (response.status() >= 400) state.badResponses.push({ url: response.url(), status: response.status() })
  })
  page.on('request', (request) => {
    if (request.method() !== 'POST' || !new URL(request.url()).pathname.endsWith(INGEST_PATH)) return
    let rows = []
    try {
      rows = JSON.parse(request.postData() || '{}').rows || []
    }
    catch { /* a malformed body is the server's problem; record zero rows */ }
    state.ingest.push({ at: Date.now(), names: rows.map(row => row?.name), status: undefined })
    state.ingestRequests.set(request, state.ingest.at(-1))
  })
}

function newState() {
  return { console: [], pageErrors: [], failedRequests: [], badResponses: [], ingest: [], ingestRequests: new Map() }
}

async function newContext(viewportName) {
  const viewport = VIEWPORTS[viewportName]
  const context = await browser.newContext({
    userAgent: SMOKE_UA,
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.isMobile,
    hasTouch: viewport.hasTouch,
    deviceScaleFactor: viewport.deviceScaleFactor,
    ignoreHTTPSErrors: local,
  })
  if (telemetryMode === 'stub') {
    await context.route(`**${INGEST_PATH}`, async (route) => {
      let accepted = 0
      try {
        accepted = (JSON.parse(route.request().postData() || '{}').rows || []).length
      }
      catch { /* ignore */ }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ accepted }) })
    })
  }
  return context
}

/** Findings are `{ level: 'error'|'warn', type, message }`. */
function judge(state, { viewportName, metrics, navStatus }) {
  const findings = []
  const add = (level, type, message) => findings.push({ level, type, message })
  if (navStatus && navStatus >= 400) add('error', 'document', `document responded ${navStatus}`)
  for (const message of state.pageErrors) add('error', 'pageerror', clip(message, 220))
  for (const entry of state.console) {
    const hydration = /hydrat/i.test(entry.text)
    if (hydration) add('error', 'hydration', clip(entry.text, 220))
    else if (entry.type === 'error') add('error', 'console-error', clip(entry.text, 220))
    else add('warn', 'console-warning', clip(entry.text, 220))
  }
  for (const entry of state.badResponses) {
    add(sameOrigin(entry.url) ? 'error' : 'warn', 'http', `${entry.status} ${clip(entry.url, 140)}`)
  }
  for (const entry of state.failedRequests) {
    add(sameOrigin(entry.url) ? 'error' : 'warn', 'request-failed', `${entry.failure} ${clip(entry.url, 140)}`)
  }
  if (metrics.overflow) {
    add(viewportName === 'mobile' ? 'error' : 'warn', 'overflow',
      `scrollWidth ${metrics.scrollWidth} > viewport ${metrics.viewportWidth}${metrics.offenders?.length ? ` — ${metrics.offenders.join('; ')}` : ''}`)
  }
  if (metrics.h1.length !== 1) {
    add('warn', 'h1', `${metrics.h1.length} <h1>${metrics.h1.length ? `: ${metrics.h1.map(text => `"${clip(text, 40)}"`).join(' | ')}` : ''}`)
  }
  const sawUiPage = state.ingest.some(entry => entry.names.includes('ui.page'))
  if (!sawUiPage) {
    add('error', 'telemetry', `no ui.page row reached POST ${INGEST_PATH} within ${TELEMETRY_WINDOW_MS / 1000}s of load (saw ${state.ingest.length} ingest request(s))`)
  }
  for (const entry of state.ingest) {
    if (entry.status && entry.status >= 400) add('error', 'telemetry', `ingest responded ${entry.status}`)
  }
  return findings
}

async function checkRoute({ route, viewportName }) {
  const context = await newContext(viewportName)
  const page = await context.newPage()
  const state = newState()
  observe(page, state)
  page.on('requestfinished', async (request) => {
    const entry = state.ingestRequests.get(request)
    if (!entry) return
    entry.status = (await request.response())?.status()
  })
  const url = new URL(route, baseUrl).href
  const result = { route, viewport: viewportName, url, findings: [], metrics: {}, screenshot: null }
  const t0 = Date.now()
  let navStatus
  try {
    const response = await page.goto(url, { waitUntil: 'load', timeout: NAV_TIMEOUT_MS })
    navStatus = response?.status()
    const loadedAt = Date.now()
    let windowStart = loadedAt
    if (devServer) {
      if (!(await waitForDevHydration(page))) {
        result.findings.push({ level: 'warn', type: 'dev-hydration', message: `not hydrated ${DEV_HYDRATION_TIMEOUT_MS / 1000}s after load (cold dev server?)` })
      }
      windowStart = Date.now()
    }
    else {
      try {
        await page.waitForLoadState('networkidle', { timeout: 10_000 })
      }
      catch {
        result.findings.push({ level: 'warn', type: 'network-idle', message: 'network never went idle within 10s of load' })
      }
    }
    // Telemetry: give the client up to TELEMETRY_WINDOW_MS after load (dev: after hydration) to flush a ui.page row.
    while (!state.ingest.some(entry => entry.names.includes('ui.page')) && Date.now() - windowStart < TELEMETRY_WINDOW_MS) {
      await page.waitForTimeout(150)
    }
    // Let the in-flight ingest response land so its status is judged.
    await page.waitForTimeout(telemetryMode === 'live' ? 400 : 100)

    const metrics = await page.evaluate(() => ({
      scrollWidth: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0),
      innerWidth: window.innerWidth,
      h1: [...document.querySelectorAll('h1')].map(el => (el.textContent || '').replace(/\s+/g, ' ').trim()),
      title: document.title,
    }))
    metrics.viewportWidth = VIEWPORTS[viewportName].width
    metrics.overflow = metrics.scrollWidth > metrics.viewportWidth + 1
    if (metrics.overflow) metrics.offenders = await page.evaluate(describeElement)
    metrics.loadMs = loadedAt - t0
    result.metrics = metrics

    // Walk the page once so lazy / reveal-on-scroll content is painted for the screenshot.
    await page.evaluate(async () => {
      const step = Math.max(300, window.innerHeight)
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y)
        await new Promise(resolve => setTimeout(resolve, 80))
      }
      window.scrollTo(0, 0)
    })
    await page.waitForTimeout(250)
    result.screenshot = `${routeSlug(route)}-${viewportName}.png`
    await page.screenshot({ path: join(await outDir(), result.screenshot), fullPage: true })
    result.findings.push(...judge(state, { viewportName, metrics, navStatus }))
  }
  catch (error) {
    result.findings.push({ level: 'error', type: 'navigation', message: clip(String(error.message).split('\n')[0], 220) })
  }
  result.ingest = state.ingest.map(({ names, status }) => ({ names, status }))
  await context.close()
  return result
}

let outDirPath
async function outDir() {
  if (!outDirPath) {
    outDirPath = resolve(process.cwd(), 'logs', 'smoke', slug)
    await mkdir(outDirPath, { recursive: true })
  }
  return outDirPath
}

// -- nav check ------------------------------------------------------------------------------
async function checkNav(route) {
  const context = await newContext('desktop')
  const page = await context.newPage()
  const state = newState()
  observe(page, state)
  const out = { route, links: [], findings: [] }
  const url = new URL(route, baseUrl).href
  try {
    await page.goto(url, { waitUntil: 'load', timeout: NAV_TIMEOUT_MS })
    if (devServer) await waitForDevHydration(page)
    else await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    // Prefer real <nav> landmarks inside <header>; fall back to any header anchor.
    let selector = 'header nav a[href], header [role="navigation"] a[href]'
    if (!(await page.locator(selector).count())) selector = 'header a[href]'
    const links = await page.$$eval(selector, anchors =>
      anchors.map((anchor, index) => ({ index, href: anchor.href, text: (anchor.textContent || '').replace(/\s+/g, ' ').trim() || anchor.getAttribute('aria-label') || '', target: anchor.target })))
    const startHref = new URL(url).href
    const startPath = new URL(url).pathname
    const seen = new Set()
    let skippedSelf = 0
    const candidates = links.filter((link) => {
      if (!sameOrigin(link.href) || link.target === '_blank') return false
      const target = new URL(link.href)
      if (target.pathname === startPath && !target.search && !target.hash) {
        skippedSelf += 1 // logo / current-page link: nothing to navigate to
        return false
      }
      const key = target.pathname + target.search + target.hash
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    if (!candidates.length) {
      out.findings.push({ level: 'warn', type: 'nav', message: `no navigable same-origin header links on the first route (${links.length} header link(s) found, ${skippedSelf} self-links)` })
    }

    for (const link of candidates) {
      const target = new URL(link.href)
      const wanted = target.pathname + target.search + target.hash
      const entry = { text: link.text, href: wanted, ok: false, finalPath: null }
      const errorsBefore = state.pageErrors.length
      let lastError
      // One retry: a click that lands before hydration (slow dev servers) is a flake, not a defect.
      for (let attempt = 0; attempt < 2 && !entry.ok; attempt++) {
        try {
          await page.goto(url, { waitUntil: 'load', timeout: NAV_TIMEOUT_MS })
          await settle(page)
          await page.locator(selector).nth(link.index).click({ timeout: 8000 })
          // In-page anchors navigate by changing the hash; everything else changes the URL.
          await page.waitForURL(next => next.href !== startHref, { timeout: 10_000 })
          await page.waitForLoadState('load', { timeout: 10_000 }).catch(() => {})
          await page.waitForTimeout(400)
          const landed = new URL(page.url())
          entry.finalPath = landed.pathname + landed.search + landed.hash
          entry.ok = true
        }
        catch (error) {
          lastError = error
        }
      }
      if (entry.ok) {
        const normalise = value => value.replace(/\/(?=($|[?#]))/, '')
        if (normalise(entry.finalPath) !== normalise(wanted)) {
          out.findings.push({ level: 'warn', type: 'nav', message: `"${link.text}" → ${wanted} landed on ${entry.finalPath}` })
        }
      }
      else {
        out.findings.push({ level: 'error', type: 'nav', message: `"${link.text}" → ${wanted}: ${clip(String(lastError?.message).split('\n')[0], 120)} (after 2 attempts)` })
      }
      for (const message of state.pageErrors.slice(errorsBefore)) {
        entry.ok = false
        out.findings.push({ level: 'error', type: 'pageerror', message: `after clicking "${link.text}": ${clip(message, 160)}` })
      }
      out.links.push(entry)
    }
  }
  catch (error) {
    out.findings.push({ level: 'error', type: 'nav', message: `could not load ${route}: ${clip(String(error.message).split('\n')[0], 160)}` })
  }
  await context.close()
  return out
}

// -- run ------------------------------------------------------------------------------------
await outDir()
const tasks = routes.flatMap(route => viewportNames.map(viewportName => ({ route, viewportName })))
const results = await mapPool(tasks, concurrency, checkRoute)
const nav = await checkNav(routes[0])
await browser.close()

const all = [...results.flatMap(result => result.findings.map(finding => ({ ...finding, route: result.route, viewport: result.viewport }))),
  ...nav.findings.map(finding => ({ ...finding, route: nav.route, viewport: 'desktop (nav)' }))]
const errors = all.filter(finding => finding.level === 'error')
const warnings = all.filter(finding => finding.level === 'warn')
const durationMs = Date.now() - started

const report = {
  tool: 'foundry-smoke-browser',
  baseUrl,
  browser: browserLabel,
  userAgent: SMOKE_UA,
  startedAt: new Date(started).toISOString(),
  durationMs,
  options: { routes: routesArg, routesNote: routesNote || undefined, viewports: viewportNames, maxRoutes: Number.isFinite(maxRoutes) ? maxRoutes : null, telemetry: telemetryMode, concurrency, devServer },
  summary: { routes: routes.length, runs: results.length, errors: errors.length, warnings: warnings.length },
  results,
  nav,
}
const dir = await outDir()
await writeFile(`${dir}/report.json`, `${JSON.stringify(report, null, 2)}\n`)

/** Identical findings across routes/viewports collapse into one group listing where they hit. */
function groupFindings(findings) {
  const groups = new Map()
  for (const finding of findings) {
    const key = `${finding.level}|${finding.type}|${finding.message}`
    const group = groups.get(key) || { level: finding.level, type: finding.type, message: finding.message, where: [] }
    group.where.push(`${finding.route}${finding.viewport.startsWith('mobile') ? ' (m)' : ''}`)
    groups.set(key, group)
  }
  return [...groups.values()].sort((a, b) => (a.level === b.level ? b.where.length - a.where.length : a.level === 'error' ? -1 : 1))
}
const where = (list, max = 3) => {
  const unique = [...new Set(list)]
  return `${unique.slice(0, max).join(', ')}${unique.length > max ? `, +${unique.length - max} more` : ''}`
}
const groups = groupFindings(all)

const mark = findings => (findings.some(finding => finding.level === 'error') ? 'ERROR' : findings.length ? 'warn' : 'ok')
const md = [
  `# Browser smoke — ${baseUrl}`,
  '',
  `${browserLabel} · ${new Date(started).toISOString()} · ${(durationMs / 1000).toFixed(1)}s · telemetry ${telemetryMode}${devServer ? ' · Vite dev server (waits for hydration, not network idle)' : ''}`,
  `**${errors.length} error(s), ${warnings.length} warning(s)** across ${routes.length} route(s) x ${viewportNames.length} viewport(s)${routesNote ? ` (${routesNote})` : ''}`,
  '',
  '| route | viewport | status | h1 | scrollWidth | ui.page ingest | screenshot |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  ...results.map(result => `| ${result.route} | ${result.viewport} | ${mark(result.findings)} | ${result.metrics.h1?.length ?? '-'} | ${result.metrics.scrollWidth ?? '-'}/${result.metrics.viewportWidth ?? '-'} | ${result.ingest.some(entry => entry.names.includes('ui.page')) ? 'yes' : 'NO'} | ${result.screenshot ? `[png](${result.screenshot})` : '-'} |`),
  '',
  `## Nav check (${nav.route}, desktop)`,
  '',
  ...(nav.links.length ? nav.links.map(link => `- ${link.ok ? 'ok' : 'FAIL'} "${link.text}" ${link.href} → ${link.finalPath ?? '(no navigation)'}`) : ['- no links exercised']),
  '',
  '## Findings (identical findings grouped)',
  '',
  ...(groups.length ? groups.map(group => `- **${group.level}** ${group.type} x${group.where.length}: ${group.message}\n  - on: ${where(group.where, 12)}`) : ['None.']),
  '',
]
await writeFile(`${dir}/summary.md`, md.join('\n'))

const rel = dir.replace(`${process.cwd()}/`, '')
const lines = [
  `foundry smoke (browser)  ${baseUrl}  ${browserLabel}  ${(durationMs / 1000).toFixed(1)}s`,
  `${routes.length} route(s) x ${viewportNames.join('+')} · telemetry ${telemetryMode} · errors ${errors.length} · warnings ${warnings.length} · ${groups.length} distinct${routesNote ? ` · ${routesNote}` : ''}`,
]
const room = 30 - lines.length - 3
for (const group of groups.slice(0, room)) {
  lines.push(`${group.level === 'error' ? 'ERR ' : 'warn'} ${group.type} x${group.where.length} [${where(group.where, 2)}] ${clip(group.message, 120)}`)
}
if (groups.length > room) lines.push(`... ${groups.length - room} more distinct finding(s) in the report`)
if (!groups.length) lines.push('no findings')
lines.push(`nav: ${nav.links.filter(link => link.ok).length}/${nav.links.length} header links navigated`)
lines.push(`report: ${rel}/report.json  (summary.md + PNGs alongside)`)
console.log(lines.join('\n'))

process.exit(errors.length > 0 ? 1 : 0)
