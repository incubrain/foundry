#!/usr/bin/env node
// HTTP smoke runner for any Foundry site.
//
//   pnpm smoke <baseUrl> [--token-env=VAR] [--write] [--sitemap-host-rewrite|--follow-sitemap-host] [--json]
//
// Checks run cheapest-first and each is recorded as pass | warn | fail | skip with
// expected vs actual. Report: logs/smoke/http-<host>-<yyyymmddThhmmss>.json.
// Exit 1 on any fail. See docs/debugging.md.

import {
  Recorder,
  SMOKE_UA,
  clip,
  extractH1s,
  extractLocs,
  extractTitle,
  hostSlug,
  isLocalHost,
  mapPool,
  normaliseBaseUrl,
  parseArgs,
  request,
  stamp,
  tryJson,
  writeLog,
} from './lib/smoke-common.mjs'

const USAGE = 'Usage: pnpm smoke <baseUrl> [--token-env=VAR] [--write] [--sitemap-host-rewrite|--follow-sitemap-host] [--json]'
const PAGE_CONCURRENCY = 4
const POLL_TIMEOUT_MS = 10_000
const POLL_INTERVAL_MS = 400
// Error payloads Nuxt/Nitro leave in an HTML body while still answering 200.
const ERROR_MARKERS = [
  /__NUXT_ERROR/,
  /"statusCode"\s*:\s*5\d\d/,
  /\bInternal Server Error\b/i,
  /\bnuxt-error-page\b/,
]

const { positionals, flags } = parseArgs(process.argv.slice(2))
const baseUrl = normaliseBaseUrl(positionals[0])
if (!baseUrl) {
  console.error(USAGE)
  process.exit(2)
}

const base = new URL(baseUrl)
const local = isLocalHost(base.hostname)
const writeMode = flags.write === true
// A local run must never silently test production: a site's sitemap names its prod host, so on
// localhost targets <loc> hosts are rewritten onto the base unless --follow-sitemap-host is passed.
const rewriteHosts = flags['sitemap-host-rewrite'] === true || (local && flags['follow-sitemap-host'] !== true)
const jsonOutput = flags.json === true
const tokenEnv = typeof flags['token-env'] === 'string' ? flags['token-env'] : ''
const token = tokenEnv ? (process.env[tokenEnv] || '').trim() : ''

if (writeMode && !local && process.env.SMOKE_ALLOW_REMOTE_WRITE !== '1') {
  console.error(`Refusing --write against ${base.host}: it sends POSTs and leaves 'smoke.ping' rows in the signal store.`)
  console.error('Use --write on localhost / a built preview. For a staging host you own, set SMOKE_ALLOW_REMOTE_WRITE=1.')
  process.exit(2)
}

const rec = new Recorder()
const started = Date.now()
const get = (path, headers) => request(new URL(path, baseUrl).href, { headers })
const authHeader = token ? { authorization: `Bearer ${token}` } : {}

const pathOf = (url) => {
  try {
    const parsed = new URL(url)
    return parsed.pathname + parsed.search
  }
  catch {
    return url
  }
}

// -- 1. health ---------------------------------------------------------------
let healthSiteId
{
  const res = await get('/api/_health', { accept: 'application/json' })
  const body = tryJson(res.text)
  const problems = []
  if (res.status !== 200) problems.push(`status ${res.status || res.error}`)
  if (res.status === 200 && !res.contentType.includes('json')) problems.push(`content-type ${res.contentType || 'none'}`)
  if (res.status === 200 && (body === undefined || typeof body !== 'object')) problems.push('body is not a JSON object')
  if (body && typeof body === 'object') {
    if (body.ok !== true) problems.push(`ok=${JSON.stringify(body.ok)}`)
    if (typeof body.service !== 'string' || !body.service) problems.push('service missing')
    if (typeof body.version !== 'string') problems.push('version missing')
    if (!('siteId' in body)) problems.push('siteId key missing')
    if (typeof body.timestamp !== 'string' || Number.isNaN(Date.parse(body.timestamp))) problems.push('timestamp missing/invalid')
  }
  const summary = body && typeof body === 'object'
    ? `service=${body.service} version=${JSON.stringify(body.version)} siteId=${JSON.stringify(body.siteId)}${body.buildId ? ` buildId=${body.buildId}` : ''}`
    : clip(res.text, 80)
  rec.add('health', 'GET /api/_health', problems.length ? 'fail' : 'pass',
    '200 JSON {ok:true, service, version, siteId, timestamp}',
    problems.length ? `${problems.join('; ')} (${clip(res.text, 80)})` : summary,
    { ms: res.ms, details: body })

  if (body && typeof body === 'object') {
    healthSiteId = body.siteId
    if (!body.siteId) {
      rec.add('health.site-id', 'health siteId is set', 'warn', 'non-empty siteId', JSON.stringify(body.siteId ?? null))
    }
    if (!body.version) {
      rec.add('health.version', 'health version is set', 'warn', 'non-empty version', JSON.stringify(body.version ?? null))
    }
    if (body.signals && typeof body.signals === 'object') {
      const { driver, epoch } = body.signals
      const memoryOnRemote = driver === 'memory' && !local
      rec.add('health.signals', 'signal store driver', memoryOnRemote ? 'warn' : 'pass',
        local ? 'any driver on localhost' : 'a durable driver (not memory) on a remote host',
        `driver=${driver} epoch=${epoch}`, { details: body.signals })
    }
  }
}

// -- 2. robots.txt -----------------------------------------------------------
{
  const res = await get('/robots.txt')
  const hasSitemap = /^\s*sitemap:/im.test(res.text)
  const ok = res.status === 200 && res.contentType.includes('text/plain') && hasSitemap
  // A dev server (or any env with indexing off) serves a blanket Disallow and no Sitemap line.
  const indexingOff = res.status === 200 && !hasSitemap && /indexing disabled/i.test(res.text)
  rec.add('robots', 'GET /robots.txt', ok ? 'pass' : indexingOff ? 'warn' : 'fail',
    '200 text/plain containing "Sitemap:"',
    `${res.status || res.error} ${res.contentType || '-'} ${hasSitemap ? 'has Sitemap:' : 'no Sitemap:'}${indexingOff ? ' (indexing disabled — dev/non-production robots)' : ''}`,
    { ms: res.ms })
}

// -- 3. sitemap --------------------------------------------------------------
let pageUrls
{
  const seen = new Set()
  const pages = new Set()
  const fetched = []
  const crawl = async (url, depth) => {
    if (seen.has(url) || depth > 2) return
    seen.add(url)
    const res = await request(url, { headers: { accept: 'application/xml,text/xml,*/*' } })
    fetched.push({ url, status: res.status, ms: res.ms, error: res.error })
    if (res.status !== 200) return
    const locs = extractLocs(res.text)
    if (/<sitemapindex/i.test(res.text)) {
      for (const loc of locs) await crawl(loc, depth + 1)
    }
    else {
      for (const loc of locs) pages.add(loc)
    }
  }
  const sitemapUrl = new URL('/sitemap.xml', baseUrl).href
  await crawl(sitemapUrl, 0)

  const first = fetched[0]
  const foreign = new Set()
  pageUrls = [...pages].map((loc) => {
    try {
      const parsed = new URL(loc)
      if (parsed.origin !== base.origin) {
        if (rewriteHosts) return new URL(parsed.pathname + parsed.search, baseUrl).href
        foreign.add(parsed.host)
      }
      return parsed.href
    }
    catch {
      return null
    }
  }).filter(Boolean)
  pageUrls = [...new Set(pageUrls)]

  const fetchFailed = fetched.filter(entry => entry.status !== 200)
  let status = 'pass'
  let actual = `${first?.status || first?.error} · ${pageUrls.length} URL(s)${fetched.length > 1 ? ` across ${fetched.length} sitemap files` : ''}`
  if (!first || first.status !== 200 || !pageUrls.length) status = 'fail'
  else if (fetchFailed.length) {
    status = 'fail'
    actual += ` · child sitemap failed: ${fetchFailed.map(entry => `${pathOf(entry.url)} → ${entry.status || entry.error}`).join(', ')}`
  }
  else if (foreign.size) {
    status = 'warn'
    actual += ` · ${foreign.size} other host(s) named in <loc>: ${[...foreign].join(', ')} (page checks hit those hosts; pass --sitemap-host-rewrite to test ${base.host} instead)`
  }
  else if (rewriteHosts) actual += ' · hosts rewritten onto base'
  rec.add('sitemap', 'GET /sitemap.xml', status, '200 with ≥1 <loc> (index followed)', actual, { ms: first?.ms })
}

// -- 4. every sitemap page ---------------------------------------------------
const pageResults = await mapPool(pageUrls, PAGE_CONCURRENCY, async (url) => {
  const res = await request(url, { headers: { accept: 'text/html' } })
  const problems = []
  let level = 'pass'
  const raise = (to, message) => {
    problems.push(message)
    if (to === 'fail' || level === 'pass') level = to
  }
  const h1s = res.status === 200 ? extractH1s(res.text) : []
  if (res.status !== 200) raise('fail', `status ${res.status || res.error}`)
  else {
    if (!res.contentType.includes('text/html')) raise('fail', `content-type ${res.contentType || 'none'}`)
    if (!extractTitle(res.text)) raise('fail', 'empty <title>')
    const marker = ERROR_MARKERS.find(pattern => pattern.test(res.text))
    if (marker) raise('fail', `error marker ${marker}`)
    if (h1s.length !== 1) raise('warn', `${h1s.length} <h1>${h1s.length > 1 ? `: ${h1s.map(text => `"${clip(text, 40)}"`).join(' | ')}` : ''}`)
  }
  const path = pathOf(url)
  return rec.add(`page:${path}`, `GET ${path}`, level,
    '200 text/html, non-empty <title>, exactly one <h1>, no error markers',
    problems.length ? problems.join('; ') : `200 · h1 "${clip(h1s[0] || '', 40)}"`,
    { ms: res.ms, url, h1: h1s })
})
{
  const counts = { pass: 0, warn: 0, fail: 0 }
  for (const check of pageResults) counts[check.status] += 1
  const slowest = [...pageResults].sort((a, b) => b.ms - a.ms)[0]
  rec.pageSummary = { total: pageResults.length, ...counts, slowest: slowest ? `${pathOf(slowest.url)} ${slowest.ms}ms` : '-' }
}

// -- 5. real HTML 404 --------------------------------------------------------
{
  const path = `/__foundry-smoke-404-${Math.random().toString(36).slice(2, 10)}`
  const res = await get(path, { accept: 'text/html' })
  const isHtml = res.contentType.includes('text/html') && /<html|<!doctype/i.test(res.text)
  const ok = res.status === 404 && isHtml
  rec.add('not-found', `GET ${path.slice(0, 22)}…`, ok ? 'pass' : 'fail',
    '404 with an HTML body',
    `${res.status || res.error} ${res.contentType || '-'}${isHtml ? '' : ' (not HTML)'}`, { ms: res.ms })
}

// -- 6. markdown negotiation --------------------------------------------------
{
  const first = pageUrls[0]
  if (!first) rec.add('markdown', 'Accept: text/markdown', 'skip', '200 text/markdown', 'no sitemap pages')
  else {
    const res = await request(first, { headers: { accept: 'text/markdown' } })
    const ok = res.status === 200 && res.contentType.includes('text/markdown')
    rec.add('markdown', `GET ${pathOf(first)} Accept: text/markdown`, ok ? 'pass' : 'warn',
      '200 text/markdown',
      `${res.status || res.error} ${res.contentType || '-'}${ok ? '' : ' (markdown negotiation unsupported)'}`, { ms: res.ms })
  }
}

// -- 7. llms.txt ---------------------------------------------------------------
{
  const res = await get('/llms.txt')
  if (res.status === 200) rec.add('llms', 'GET /llms.txt', 'pass', '200 or absent', `200 ${res.contentType || '-'} ${res.text.length}B`, { ms: res.ms })
  else if (res.status === 404) rec.add('llms', 'GET /llms.txt', 'skip', '200 or absent', '404 — site does not publish llms.txt', { ms: res.ms })
  else rec.add('llms', 'GET /llms.txt', 'fail', '200 or 404', `${res.status || res.error}`, { ms: res.ms })
}

// -- 8. export closed without a token ------------------------------------------
{
  const res = await get('/api/_signals/export?limit=1')
  if (res.status === 401) rec.add('export-auth', 'GET /api/_signals/export (no token)', 'pass', '401', '401', { ms: res.ms })
  else if (res.status === 503) {
    rec.add('export-auth', 'GET /api/_signals/export (no token)', 'warn', '401', '503 — export token is unset on this site (endpoint closed, so Polaris cannot pull)', { ms: res.ms })
  }
  else rec.add('export-auth', 'GET /api/_signals/export (no token)', 'fail', '401 (or 503 if unconfigured)', `${res.status || res.error} ${clip(res.text, 60)}`, { ms: res.ms })
}

// -- 9. export with token ------------------------------------------------------
let exportReady = false
if (tokenEnv) {
  if (!token) {
    rec.add('export', 'GET /api/_signals/export (token)', 'fail', `env ${tokenEnv} to hold the bearer token`, `env ${tokenEnv} is empty/unset`)
  }
  else {
    const res = await get('/api/_signals/export?limit=1', { ...authHeader, accept: 'application/json' })
    const body = tryJson(res.text)
    const ok = res.status === 200 && Array.isArray(body?.rows) && typeof body?.cursor === 'number'
    const extras = []
    if (body?.epoch !== undefined) extras.push(`epoch=${JSON.stringify(body.epoch)}`)
    if (body?.meta !== undefined) extras.push(`meta=${clip(body.meta, 60)}`)
    exportReady = ok
    rec.add('export', 'GET /api/_signals/export?limit=1 (token)', ok ? 'pass' : 'fail',
      '200 {rows: [], cursor: number}',
      ok ? `200 rows=${body.rows.length} cursor=${body.cursor}${extras.length ? ` ${extras.join(' ')}` : ''}` : `${res.status || res.error} ${clip(res.text, 80)}`,
      { ms: res.ms })
  }
}
else {
  rec.add('export', 'GET /api/_signals/export (token)', 'skip', '200 with rows + cursor', 'no --token-env given')
}

// -- 10. ingest → export round trip (--write only) ------------------------------
if (writeMode) {
  const ingestUrl = new URL('/api/_signals/ingest', baseUrl).href
  const jsonHeaders = { 'content-type': 'application/json' }

  // Baseline: walk the export to its head so only rows written after this point count.
  let cursor = 0
  const drain = async () => {
    const found = []
    for (let page = 0; page < 50; page++) {
      const res = await get(`/api/_signals/export?since=${cursor}&limit=2000`, { ...authHeader, accept: 'application/json' })
      const body = tryJson(res.text)
      if (res.status !== 200 || !Array.isArray(body?.rows)) return { found, error: `${res.status || res.error}` }
      found.push(...body.rows)
      if (!body.rows.length || typeof body.cursor !== 'number') break
      cursor = body.cursor
    }
    return { found }
  }
  if (exportReady) await drain()

  const marker = `smoke-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const res = await request(ingestUrl, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ rows: [{ kind: 'event', name: 'smoke.ping', data: { marker, source: 'foundry-smoke' } }] }),
  })
  const accepted = tryJson(res.text)?.accepted
  rec.add('ingest', 'POST /api/_signals/ingest (smoke.ping)', res.status === 200 && accepted === 1 ? 'pass' : 'fail',
    '200 {accepted: 1}', `${res.status || res.error} ${clip(res.text, 80)}`, { ms: res.ms, marker })

  if (res.status === 200 && exportReady) {
    const polled = performance.now()
    let hit
    while (!hit && performance.now() - polled < POLL_TIMEOUT_MS) {
      const { found, error } = await drain()
      hit = found.find(row => row?.data?.marker === marker)
      if (error) break
      if (!hit) await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
    }
    const waited = Math.round(performance.now() - polled)
    rec.add('round-trip', 'ingest → export round trip', hit ? 'pass' : 'fail',
      `marker visible in export within ${POLL_TIMEOUT_MS / 1000}s`,
      hit ? `seen after ${waited}ms (seq ${hit.seq})` : `marker not seen after ${waited}ms`, { ms: waited })
    if (hit) {
      const cls = hit.visitor?.class
      const nonHuman = Boolean(cls) && cls !== 'human'
      const label = `${cls}${hit.visitor?.subclass ? `/${hit.visitor.subclass}` : ''}`
      rec.add('ua-class', `visitor.class stamped for ${SMOKE_UA.split(' ')[0]}`,
        nonHuman ? 'pass' : 'warn',
        'agent | bot (smoke traffic kept out of the human split)',
        nonHuman ? label : `${label} — the layer's classifier does not recognise the FoundrySmoke UA, so smoke rows count as human`,
        { details: hit.visitor })
    }
  }
  else if (res.status === 200) {
    rec.add('round-trip', 'ingest → export round trip', 'warn', 'marker visible in export', 'unverified — pass --token-env to read the export back')
  }

  const badSchema = await request(ingestUrl, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ rows: 'nope' }) })
  rec.add('ingest-400-schema', 'POST ingest {rows:"nope"}', badSchema.status === 400 ? 'pass' : 'fail',
    '400', `${badSchema.status || badSchema.error} ${clip(badSchema.text, 60)}`, { ms: badSchema.ms })

  const badJson = await request(ingestUrl, { method: 'POST', headers: jsonHeaders, body: '{"rows":[' })
  rec.add('ingest-400-json', 'POST ingest with unparseable JSON', badJson.status === 400 ? 'pass' : 'fail',
    '400', `${badJson.status || badJson.error} ${clip(badJson.text, 60)}`, { ms: badJson.ms })
}
else {
  rec.add('ingest', 'POST /api/_signals/ingest', 'skip', 'only with --write', 'read-only run')
}

// -- report ---------------------------------------------------------------------
const durationMs = Date.now() - started
const counts = rec.counts()
const report = {
  tool: 'foundry-smoke-http',
  baseUrl,
  userAgent: SMOKE_UA,
  startedAt: new Date(started).toISOString(),
  durationMs,
  options: { write: writeMode, sitemapHostRewrite: rewriteHosts, tokenEnv: tokenEnv || null, tokenProvided: Boolean(token) },
  siteId: healthSiteId ?? null,
  summary: { ...counts, pages: rec.pageSummary },
  checks: rec.checks,
}
const file = await writeLog(`http-${hostSlug(baseUrl)}-${stamp(new Date(started))}.json`, report)
const rel = file.replace(`${process.cwd()}/`, '')

if (jsonOutput) {
  console.log(JSON.stringify({ ...report, reportFile: rel }, null, 2))
}
else {
  const lines = [
    `foundry smoke (http)  ${baseUrl}  ${(durationMs / 1000).toFixed(1)}s`,
    `pass ${counts.pass} · warn ${counts.warn} · fail ${counts.fail} · skip ${counts.skip}   pages: ${rec.pageSummary.total} (${rec.pageSummary.fail} fail, ${rec.pageSummary.warn} warn, slowest ${rec.pageSummary.slowest})`,
  ]
  const bad = rec.checks.filter(check => check.status === 'fail' || check.status === 'warn')
    .sort((a, b) => (a.status === b.status ? 0 : a.status === 'fail' ? -1 : 1))
  const room = 30 - lines.length - 2
  for (const check of bad.slice(0, room)) {
    lines.push(`${check.status.toUpperCase().padEnd(4)} ${clip(check.name, 38)}  expected: ${clip(check.expected, 40)} | actual: ${clip(check.actual, 90)}`)
  }
  if (bad.length > room) lines.push(`... ${bad.length - room} more finding(s) in the report`)
  if (!bad.length) lines.push('no warnings or failures')
  lines.push(`report: ${rel}`)
  console.log(lines.join('\n'))
}

process.exit(counts.fail > 0 ? 1 : 0)
