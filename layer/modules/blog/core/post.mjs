// Blog post core — pure, no I/O. Shared by the Nuxt module (TS) and the
// `foundry-blog` bin (plain node, no type stripping), so keep it plain ESM.
import { Document, parse as parseYaml } from 'yaml'
import { z } from 'zod'

/** Frontmatter keys in the order `renderPost` writes them. Unknown keys follow. */
export const KEY_ORDER = [
  'title',
  'description',
  'publishAt',
  'draft',
  'updatedAt',
  'canonical',
  'author',
  'tags',
  'image',
  'source',
]

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/i

/** Is `slug` a safe file/URL slug? */
export function isSlug(slug) {
  return typeof slug === 'string' && slug.length <= 100 && SLUG_RE.test(slug)
}

/**
 * Parse a publish time: a `Date`, or an ISO 8601 string. A date-only string or
 * one with no offset is UTC. Anything else (including rolled-over dates such
 * as Feb 31) is `null`.
 */
export function parsePublishAt(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value !== 'string') return null
  const m = ISO_RE.exec(value.trim())
  if (!m) return null
  const [, y, mo, d, h = '00', mi = '00', zone] = m
  const probe = new Date(Date.UTC(+y, +mo - 1, +d))
  if (probe.getUTCFullYear() !== +y || probe.getUTCMonth() !== +mo - 1 || probe.getUTCDate() !== +d) return null
  if (+h > 23 || +mi > 59) return null
  let text = value.trim().replace(' ', 'T')
  if (m[4] === undefined) text += 'T00:00:00Z'
  else if (!zone) text += 'Z'
  else text = text.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')
  const at = new Date(text)
  return Number.isNaN(at.getTime()) ? null : at
}

/** `draft` | `scheduled` | `live`. Draft wins; a missing or invalid `publishAt` is a draft. */
export function postState(fm, now = new Date()) {
  if (!fm || typeof fm !== 'object') return 'draft'
  if (fm.draft !== undefined && fm.draft !== null && fm.draft !== false) return 'draft'
  const at = parsePublishAt(fm.publishAt)
  const nowMs = new Date(now).getTime()
  if (!at || Number.isNaN(nowMs)) return 'draft'
  return at.getTime() <= nowMs ? 'live' : 'scheduled'
}

export function isLive(fm, now = new Date()) {
  return postState(fm, now) === 'live'
}

/** ASCII URL slug from a title; '' when nothing usable is left (e.g. a non-Latin title). */
export function slugify(title) {
  return String(title ?? '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '')
}

function trimBody(body) {
  return String(body ?? '').replace(/\r\n?/g, '\n').replace(/^\n+/, '').replace(/\s+$/, '')
}

function isEmpty(value) {
  return value === undefined || value === null || value === ''
    || (Array.isArray(value) && value.length === 0)
}

/** Known keys in `KEY_ORDER`, then any unknown ones; empty optionals dropped; `draft` always written. */
function orderFrontmatter(fm) {
  const src = { ...fm, draft: fm?.draft === true }
  const out = {}
  for (const key of KEY_ORDER) {
    if (key === 'draft' || key === 'title' || key === 'publishAt' || !isEmpty(src[key])) out[key] = src[key]
  }
  for (const key of Object.keys(src)) {
    if (!(key in out) && !isEmpty(src[key])) out[key] = src[key]
  }
  return out
}

/** Frontmatter + body to file text. Stable: render(parse(render(x))) === render(x). */
export function renderPost({ frontmatter, body }) {
  const doc = new Document(orderFrontmatter(frontmatter))
  for (const key of ['publishAt', 'updatedAt']) {
    const node = doc.get(key, true)
    if (node && typeof node.value === 'string') node.type = 'QUOTE_DOUBLE'
  }
  const text = trimBody(body)
  return `---\n${doc.toString({ lineWidth: 0 })}---\n${text ? `\n${text}\n` : ''}`
}

/** File text to `{ frontmatter, body }`. Throws on malformed YAML. */
export function parsePost(text) {
  const src = String(text ?? '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  const m = /^---[ \t]*\n(?:([\s\S]*?)\n)?---[ \t]*(?:\n|$)/.exec(src)
  if (!m) return { frontmatter: {}, body: trimBody(src) }
  const parsed = parseYaml(m[1] ?? '')
  const frontmatter = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  return { frontmatter, body: trimBody(src.slice(m[0].length)) }
}

/** Zod schema for the `upsert` input (also the MCP tool's input shape). Built lazily so the Nuxt bundle can tree-shake it. */
export function postInputSchema() {
  return z.object({
    slug: z.string().optional(),
    title: z.string().trim().min(1, 'title is required'),
    description: z.string().nullish(),
    body: z.string(),
    publishAt: z.string().nullish(),
    draft: z.boolean().nullish(),
    canonical: z.url().nullish(),
    author: z.string().nullish(),
    tags: z.array(z.string().trim().min(1)).nullish(),
    image: z.object({ src: z.string().min(1), alt: z.string() }).nullish(),
    source: z.string().nullish(),
  }).strict()
}

/**
 * Validate and normalise an `upsert` input. `slug` is derived from the title
 * when absent; `publishAt` becomes a UTC `toISOString()` (left undefined when
 * absent — the caller decides the default). `null` on an optional field means
 * "clear it".
 */
export function validatePostInput(input) {
  const parsed = postInputSchema().safeParse(input)
  const issues = parsed.success
    ? []
    : parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
  const value = parsed.success ? { ...parsed.data } : null
  if (value) {
    value.slug = value.slug ?? slugify(value.title)
    if (!isSlug(value.slug)) {
      issues.push({
        path: 'slug',
        message: value.slug
          ? 'slug must be lowercase letters, digits and single hyphens'
          : 'could not derive a slug from the title; pass "slug"',
      })
    }
    if (typeof value.publishAt === 'string') {
      const at = parsePublishAt(value.publishAt)
      if (at) value.publishAt = at.toISOString()
      else issues.push({ path: 'publishAt', message: 'publishAt must be an ISO 8601 date or datetime' })
    }
  }
  if (issues.length > 0 || !value) {
    return { ok: false, issues, message: issues.map(i => `${i.path || 'input'}: ${i.message}`).join('; ') }
  }
  return { ok: true, value }
}
