// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any

const BIN = fileURLToPath(new URL('../../../layer/bin/foundry-blog.mjs', import.meta.url))
const POST = { title: 'Hello World', description: 'First post', body: 'Hi there.', publishAt: '2020-01-01T00:00:00Z' }

let repo: string
const git = (...args: string[]) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim()

function cli(args: string[], input?: unknown, cwd = repo) {
  const run = spawnSync(process.execPath, [BIN, ...args], {
    cwd,
    input: input === undefined ? '' : JSON.stringify(input),
    encoding: 'utf8',
  })
  return { code: run.status, out: JSON.parse(run.stdout) as Json, stderr: run.stderr }
}

function initRepo(dir: string, { commit = true } = {}) {
  execFileSync('git', ['init', '-q', '-b', 'main', dir])
  execFileSync('git', ['-C', dir, 'config', 'user.name', 'Test'])
  execFileSync('git', ['-C', dir, 'config', 'user.email', 'test@example.com'])
  if (commit) {
    writeFileSync(join(dir, 'README.md'), '# site\n')
    execFileSync('git', ['-C', dir, 'add', '.'])
    execFileSync('git', ['-C', dir, 'commit', '-q', '-m', 'init'])
  }
}

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'foundry-blog-'))
  initRepo(repo)
})
afterEach(() => rmSync(repo, { recursive: true, force: true }))

describe('foundry-blog upsert', () => {
  it('creates the file and commits only that path', () => {
    writeFileSync(join(repo, 'other.txt'), 'staged elsewhere\n')
    git('add', 'other.txt')

    const { code, out } = cli(['upsert'], POST)
    expect(code).toBe(0)
    expect(out).toMatchObject({
      ok: true,
      slug: 'hello-world',
      path: 'content/blog/hello-world.md',
      state: 'live',
      publishAt: '2020-01-01T00:00:00.000Z',
      pushed: false,
      changed: true,
    })
    expect(out.commit).toBe(git('rev-parse', 'HEAD'))
    expect(git('log', '-1', '--format=%s')).toBe('blog: created hello-world (live, 2020-01-01T00:00:00.000Z)')
    expect(git('show', '--name-only', '--format=', 'HEAD')).toBe('content/blog/hello-world.md')
    expect(git('status', '--porcelain')).toBe('A  other.txt')

    const text = readFileSync(join(repo, 'content/blog/hello-world.md'), 'utf8')
    expect(text).toContain('publishAt: "2020-01-01T00:00:00.000Z"')
    expect(text.endsWith('Hi there.\n')).toBe(true)
  })

  it('is idempotent: identical content is changed:false with no commit', () => {
    const first = cli(['upsert'], POST).out
    const again = cli(['upsert'], POST)
    expect(again.code).toBe(0)
    expect(again.out).toMatchObject({ ok: true, changed: false, commit: null, pushed: false })
    expect(git('rev-parse', 'HEAD')).toBe(first.commit)

    // publishAt omitted on an existing post keeps the stored time instead of resetting to now.
    const { publishAt: _drop, ...noPublishAt } = POST
    expect(cli(['upsert'], noPublishAt).out).toMatchObject({ changed: false, publishAt: '2020-01-01T00:00:00.000Z' })
  })

  it('updates, stamps updatedAt and says "updated"', () => {
    cli(['upsert'], POST)
    const { out } = cli(['upsert'], { ...POST, body: 'Edited.' })
    expect(out).toMatchObject({ ok: true, changed: true })
    expect(git('log', '-1', '--format=%s')).toBe('blog: updated hello-world (live, 2020-01-01T00:00:00.000Z)')
    const post = cli(['get', 'hello-world']).out.post
    expect(post.body).toBe('Edited.')
    expect(typeof post.frontmatter.updatedAt).toBe('string')
  })

  it('defaults publishAt to now on create and normalises offsets to UTC', () => {
    const now = cli(['upsert'], { title: 'Now Post', body: 'x' }).out
    expect(now.state).toBe('live')
    expect(Math.abs(Date.now() - new Date(now.publishAt).getTime())).toBeLessThan(60_000)

    const later = cli(['upsert'], { title: 'Later', body: 'x', publishAt: '2099-01-01T14:30:00+05:30' }).out
    expect(later).toMatchObject({ state: 'scheduled', publishAt: '2099-01-01T09:00:00.000Z' })
  })

  it('writes an explicit draft as draft and lets null clear a field', () => {
    expect(cli(['upsert'], { ...POST, draft: true, author: 'Ann' }).out.state).toBe('draft')
    cli(['upsert'], { ...POST, draft: true, author: null })
    expect(cli(['get', 'hello-world']).out.post.frontmatter.author).toBeUndefined()
  })

  it('honours --dir and --author', () => {
    const { out } = cli(['upsert', '--dir', 'posts', '--author', 'Pat <pat@example.com>'], POST)
    expect(out.path).toBe('posts/hello-world.md')
    expect(git('log', '-1', '--format=%an <%ae>')).toBe('Pat <pat@example.com>')
  })

  it('--no-commit writes the file and leaves git alone', () => {
    const { out } = cli(['upsert', '--no-commit'], POST)
    expect(out).toMatchObject({ ok: true, commit: null, changed: true })
    expect(existsSync(join(repo, 'content/blog/hello-world.md'))).toBe(true)
    expect(git('log', '--format=%s')).toBe('init')
  })

  it('works in a repo with no commits yet', () => {
    const fresh = mkdtempSync(join(tmpdir(), 'foundry-blog-fresh-'))
    try {
      initRepo(fresh, { commit: false })
      const { code, out } = cli(['upsert', '--root', fresh], POST)
      expect(code).toBe(0)
      expect(out.commit).toMatch(/^[0-9a-f]{40}$/)
    }
    finally {
      rmSync(fresh, { recursive: true, force: true })
    }
  })
})

describe('foundry-blog schedule / unpublish / list', () => {
  it('schedule sets publishAt, clears draft and commits', () => {
    cli(['upsert'], { ...POST, draft: true })
    const { out } = cli(['schedule', 'hello-world', '--at', '2099-06-01T08:00:00Z'])
    expect(out).toMatchObject({ ok: true, state: 'scheduled', publishAt: '2099-06-01T08:00:00.000Z', changed: true })
    expect(git('log', '-1', '--format=%s')).toBe('blog: scheduled hello-world (scheduled, 2099-06-01T08:00:00.000Z)')
    expect(cli(['schedule', 'hello-world', '--at', '2099-06-01T08:00:00Z']).out.changed).toBe(false)
  })

  it('unpublish marks a live post as a draft', () => {
    cli(['upsert'], POST)
    const { out } = cli(['unpublish', 'hello-world'])
    expect(out).toMatchObject({ ok: true, state: 'draft', changed: true })
    expect(cli(['get', 'hello-world']).out.post.frontmatter.draft).toBe(true)
  })

  it('list reports state per post, newest first', () => {
    cli(['upsert'], { title: 'Old', body: 'x', publishAt: '2020-01-01T00:00:00Z' })
    cli(['upsert'], { title: 'Future', body: 'x', publishAt: '2099-01-01T00:00:00Z' })
    cli(['upsert'], { title: 'Hidden', body: 'x', publishAt: '2021-01-01T00:00:00Z', draft: true })
    const { posts } = cli(['list']).out
    expect(posts.map((p: Json) => [p.slug, p.state])).toEqual([
      ['future', 'scheduled'],
      ['hidden', 'draft'],
      ['old', 'live'],
    ])
    expect(posts[1]).toMatchObject({ draft: true, path: 'content/blog/hidden.md', title: 'Hidden' })
  })

  it('list on a site with no posts is empty', () => {
    expect(cli(['list']).out).toEqual({ ok: true, posts: [] })
  })
})

describe('foundry-blog refusals (exit 2)', () => {
  const refuses = (result: ReturnType<typeof cli>, error: string) => {
    expect(result.code).toBe(2)
    expect(result.out).toMatchObject({ ok: false, error })
    expect(typeof result.out.message).toBe('string')
  }

  it('record-dirty when the target file has uncommitted changes', () => {
    cli(['upsert'], POST)
    const file = join(repo, 'content/blog/hello-world.md')
    writeFileSync(file, `${readFileSync(file, 'utf8')}\nhand edit\n`)
    const before = readFileSync(file, 'utf8')
    refuses(cli(['upsert'], { ...POST, body: 'Overwrite?' }), 'record-dirty')
    refuses(cli(['unpublish', 'hello-world']), 'record-dirty')
    expect(readFileSync(file, 'utf8')).toBe(before)
  })

  it('record-dirty for an untracked file at the target path', () => {
    cli(['upsert', '--no-commit'], POST)
    refuses(cli(['upsert'], POST), 'record-dirty')
  })

  it('wrong-branch when HEAD is not --branch, and writes nothing', () => {
    refuses(cli(['upsert', '--branch', 'release'], POST), 'wrong-branch')
    expect(existsSync(join(repo, 'content/blog'))).toBe(false)
    expect(cli(['upsert', '--branch', 'main'], POST).code).toBe(0)
  })

  it('not-a-repo outside git (but --no-commit still writes)', () => {
    const plain = mkdtempSync(join(tmpdir(), 'foundry-blog-plain-'))
    try {
      refuses(cli(['upsert'], POST, plain), 'not-a-repo')
      expect(cli(['upsert', '--no-commit'], POST, plain).code).toBe(0)
    }
    finally {
      rmSync(plain, { recursive: true, force: true })
    }
  })

  it('invalid for bad JSON, bad input, bad slug, bad --at, bad flags and unknown commands', () => {
    const badJson = spawnSync(process.execPath, [BIN, 'upsert'], { cwd: repo, input: '{nope', encoding: 'utf8' })
    expect(badJson.status).toBe(2)
    expect(JSON.parse(badJson.stdout)).toMatchObject({ ok: false, error: 'invalid' })
    refuses(cli(['upsert'], { body: 'no title' }), 'invalid')
    refuses(cli(['upsert'], { ...POST, publishAt: 'whenever' }), 'invalid')
    refuses(cli(['get', '../etc/passwd']), 'invalid')
    cli(['upsert'], POST)
    refuses(cli(['schedule', 'hello-world', '--at', 'whenever']), 'invalid')
    refuses(cli(['schedule', 'hello-world']), 'invalid')
    refuses(cli(['list', '--bogus']), 'invalid')
    refuses(cli(['frobnicate']), 'invalid')
    refuses(cli(['list', '--dir', '../escape']), 'invalid')
  })

  it('no-post for get / schedule / unpublish of a missing slug', () => {
    refuses(cli(['get', 'ghost']), 'no-post')
    refuses(cli(['schedule', 'ghost', '--at', '2099-01-01']), 'no-post')
    refuses(cli(['unpublish', 'ghost']), 'no-post')
  })
})

describe('foundry-blog --push', () => {
  it('pushes the current branch to its upstream after the commit', () => {
    const remote = mkdtempSync(join(tmpdir(), 'foundry-blog-remote-'))
    try {
      execFileSync('git', ['init', '-q', '--bare', '-b', 'main', remote])
      git('remote', 'add', 'origin', remote)
      git('push', '-q', '-u', 'origin', 'main')

      const { out } = cli(['upsert', '--push'], POST)
      expect(out).toMatchObject({ ok: true, pushed: true })
      expect(execFileSync('git', ['-C', remote, 'rev-parse', 'main'], { encoding: 'utf8' }).trim()).toBe(out.commit)

      expect(cli(['upsert', '--push'], POST).out).toMatchObject({ changed: false, pushed: false })
    }
    finally {
      rmSync(remote, { recursive: true, force: true })
    }
  })

  it('never pushes unless asked, and push-failed keeps the commit', () => {
    expect(cli(['upsert'], POST).out.pushed).toBe(false)
    const failed = cli(['upsert', '--push'], { ...POST, body: 'Second.' })
    expect(failed.code).toBe(2)
    expect(failed.out).toMatchObject({ ok: false, error: 'push-failed' })
    expect(failed.out.commit).toBe(git('rev-parse', 'HEAD'))
  })
})
