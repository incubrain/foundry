// Blog post store — the git-backed writer behind the `foundry-blog` bin and its
// MCP server. Node-only (fs + git); the Nuxt runtime never imports this file.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { isSlug, parsePost, parsePublishAt, postState, renderPost, validatePostInput } from './post.mjs'

/** A refusal: `code` is one of invalid | no-post | not-a-repo | record-dirty | wrong-branch | commit-failed | push-failed. */
export class BlogError extends Error {
  constructor(code, message, extra = {}) {
    super(message)
    this.code = code
    this.extra = extra
  }
}

function git(root, args) {
  try {
    return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  }
  catch (error) {
    const detail = String(error.stderr || error.message || '').trim()
    throw Object.assign(new Error(detail || `git ${args[0]} failed`), { git: true })
  }
}

function isRepo(root) {
  try {
    return git(root, ['rev-parse', '--is-inside-work-tree']) === 'true'
  }
  catch {
    return false
  }
}

function currentBranch(root) {
  try {
    return git(root, ['symbolic-ref', '--short', 'HEAD'])
  }
  catch {
    return 'HEAD'
  }
}

/**
 * @param {object} [opts]
 * @param {string} [opts.root] site repo (default cwd)
 * @param {string} [opts.dir] content dir under root (default `content/blog`)
 * @param {string} [opts.branch] refuse `wrong-branch` unless HEAD is this branch
 * @param {boolean} [opts.commit] commit each write (default true)
 * @param {boolean} [opts.push] push the current branch after a commit (default false)
 * @param {string} [opts.author] `Name <email>` for `git commit --author`
 * @param {() => Date} [opts.now] clock, injectable for tests
 */
export function createStore({ root = process.cwd(), dir = 'content/blog', branch, commit = true, push = false, author, now = () => new Date() } = {}) {
  const repoRoot = resolve(root)
  const blogDir = resolve(repoRoot, dir)
  const inside = relative(repoRoot, blogDir)
  if (isAbsolute(inside) || inside.split(sep)[0] === '..') {
    throw new BlogError('invalid', `--dir must stay inside the repo root: ${dir}`)
  }

  const fileFor = (slug) => {
    if (!isSlug(slug)) throw new BlogError('invalid', `invalid slug: ${JSON.stringify(slug)}`)
    return join(blogDir, `${slug}.md`)
  }
  const rel = file => relative(repoRoot, file).split(sep).join('/')

  function load(file) {
    const text = readFileSync(file, 'utf8')
    try {
      return { text, ...parsePost(text) }
    }
    catch (error) {
      throw new BlogError('invalid', `cannot parse ${rel(file)}: ${error.message}`)
    }
  }

  function list() {
    if (!existsSync(blogDir)) return { ok: true, posts: [] }
    const at = now()
    const posts = readdirSync(blogDir)
      .filter(name => name.endsWith('.md') && isSlug(name.slice(0, -3)))
      .map((name) => {
        const slug = name.slice(0, -3)
        const file = join(blogDir, name)
        let fm = {}
        try {
          fm = load(file).frontmatter
        }
        catch { /* unreadable frontmatter lists as a draft */ }
        return { slug, title: fm.title ?? slug, publishAt: fm.publishAt ?? null, draft: fm.draft === true, state: postState(fm, at), path: rel(file) }
      })
    const stamp = p => parsePublishAt(p.publishAt)?.getTime() ?? 0
    posts.sort((a, b) => stamp(b) - stamp(a) || a.slug.localeCompare(b.slug))
    return { ok: true, posts }
  }

  function get(slug) {
    const file = fileFor(slug)
    if (!existsSync(file)) throw new BlogError('no-post', `no post "${slug}" in ${rel(blogDir)}`)
    const parsed = load(file)
    return {
      ok: true,
      post: { slug, frontmatter: parsed.frontmatter, body: parsed.body, state: postState(parsed.frontmatter, now()), path: rel(file) },
    }
  }

  /** Undo a write whose commit failed, so the next call is not refused as `record-dirty`. */
  function rollback(file, existing) {
    if (existing) writeFileSync(file, existing.text)
    else rmSync(file, { force: true })
    for (const args of [['reset', '-q', '--', file], ['rm', '--cached', '-q', '-f', '--', file]]) {
      try {
        git(repoRoot, args)
        break
      }
      catch { /* try the unborn-branch form next */ }
    }
  }

  /** Guards, then `build(existing|null)` → `{frontmatter, body, verb}`; writes + commits only when the rendered file changes. */
  function mutate(slug, build) {
    const file = fileFor(slug)
    const inRepo = isRepo(repoRoot)
    if ((commit || branch || push) && !inRepo) throw new BlogError('not-a-repo', `${repoRoot} is not inside a git repository`)
    if (branch && currentBranch(repoRoot) !== branch) {
      throw new BlogError('wrong-branch', `on "${currentBranch(repoRoot)}", expected "${branch}"`)
    }
    if (inRepo && git(repoRoot, ['status', '--porcelain', '--', file])) {
      throw new BlogError('record-dirty', `${rel(file)} has uncommitted changes; commit or discard them first`)
    }

    const existing = existsSync(file) ? load(file) : null
    const { frontmatter, body, verb } = build(existing)
    const before = existing ? renderPost(existing) : null
    let after = renderPost({ frontmatter, body })
    const changed = before !== after
    if (changed && existing) {
      after = renderPost({ frontmatter: { ...frontmatter, updatedAt: now().toISOString() }, body })
    }

    const result = { slug, path: rel(file), state: postState(frontmatter, now()), publishAt: frontmatter.publishAt, commit: null, pushed: false, changed }
    if (!changed) return { ok: true, ...result }

    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, after)
    if (!commit) return { ok: true, ...result }

    const message = `blog: ${existing ? verb.update : verb.create} ${slug} (${result.state}, ${result.publishAt})`
    try {
      git(repoRoot, ['add', '--', file])
      git(repoRoot, ['commit', '-m', message, ...(author ? ['--author', author] : []), '--', file])
      result.commit = git(repoRoot, ['rev-parse', 'HEAD'])
    }
    catch (error) {
      rollback(file, existing)
      throw new BlogError('commit-failed', error.message, { path: result.path })
    }
    if (push) {
      try {
        git(repoRoot, ['push'])
        result.pushed = true
      }
      catch (error) {
        throw new BlogError('push-failed', `committed ${result.commit.slice(0, 9)} but push failed: ${error.message}`, { ...result })
      }
    }
    return { ok: true, ...result }
  }

  function upsert(input) {
    const checked = validatePostInput(input)
    if (!checked.ok) throw new BlogError('invalid', checked.message, { issues: checked.issues })
    const { slug, body, ...fields } = checked.value
    return mutate(slug, (existing) => {
      const merged = { ...(existing?.frontmatter ?? {}) }
      for (const [key, value] of Object.entries(fields)) {
        if (value === null) delete merged[key]
        else if (value !== undefined) merged[key] = value
      }
      merged.publishAt ??= now().toISOString()
      merged.draft ??= false
      return { frontmatter: merged, body, verb: { create: 'created', update: 'updated' } }
    })
  }

  function patch(slug, change, verb) {
    return mutate(slug, (existing) => {
      if (!existing) throw new BlogError('no-post', `no post "${slug}" in ${rel(blogDir)}`)
      return { frontmatter: { ...existing.frontmatter, ...change }, body: existing.body, verb: { update: verb, create: verb } }
    })
  }

  function schedule(slug, at) {
    const when = parsePublishAt(at)
    if (!when) throw new BlogError('invalid', `--at must be an ISO 8601 date or datetime, got ${JSON.stringify(at)}`)
    return patch(slug, { publishAt: when.toISOString(), draft: false }, 'scheduled')
  }

  function unpublish(slug) {
    return patch(slug, { draft: true }, 'unpublished')
  }

  return { list, get, upsert, schedule, unpublish }
}
