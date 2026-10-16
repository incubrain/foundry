// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any

const BIN = fileURLToPath(new URL('../../../layer/bin/foundry-blog.mjs', import.meta.url))

let repo: string
let client: Client

beforeEach(async () => {
  repo = mkdtempSync(join(tmpdir(), 'foundry-blog-mcp-'))
  execFileSync('git', ['init', '-q', '-b', 'main', repo])
  execFileSync('git', ['-C', repo, 'config', 'user.name', 'Test'])
  execFileSync('git', ['-C', repo, 'config', 'user.email', 'test@example.com'])
  writeFileSync(join(repo, 'README.md'), '# site\n')
  execFileSync('git', ['-C', repo, 'add', '.'])
  execFileSync('git', ['-C', repo, 'commit', '-q', '-m', 'init'])

  client = new Client({ name: 'blog-test', version: '1.0.0' })
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [BIN, 'mcp', '--root', repo] }))
})

afterEach(async () => {
  await client.close()
  rmSync(repo, { recursive: true, force: true })
})

const call = async (name: string, args: Record<string, unknown> = {}) => {
  const res = await client.callTool({ name, arguments: args })
  const [first] = res.content as { type: string, text: string }[]
  return { isError: res.isError === true, data: JSON.parse(first!.text) as Json }
}

describe('foundry-blog mcp', () => {
  it('lists the five tools', async () => {
    const { tools } = await client.listTools()
    expect(tools.map(t => t.name).sort()).toEqual(['get_post', 'list_posts', 'schedule_post', 'unpublish_post', 'upsert_post'])
    const upsert = tools.find(t => t.name === 'upsert_post')!
    expect(upsert.inputSchema.required).toEqual(expect.arrayContaining(['title', 'body']))
  })

  it('upsert_post writes and commits; the other tools see it', async () => {
    const up = await call('upsert_post', { title: 'Via MCP', body: 'Hello from an agent.', publishAt: '2099-03-04T05:06:07Z' })
    expect(up.isError).toBe(false)
    expect(up.data).toMatchObject({ ok: true, slug: 'via-mcp', state: 'scheduled', changed: true, pushed: false })
    expect(execFileSync('git', ['-C', repo, 'log', '-1', '--format=%s'], { encoding: 'utf8' }).trim())
      .toBe('blog: created via-mcp (scheduled, 2099-03-04T05:06:07.000Z)')

    expect((await call('list_posts')).data.posts).toMatchObject([{ slug: 'via-mcp', state: 'scheduled' }])
    expect((await call('get_post', { slug: 'via-mcp' })).data.post.body).toBe('Hello from an agent.')
    expect((await call('upsert_post', { title: 'Via MCP', body: 'Hello from an agent.', publishAt: '2099-03-04T05:06:07Z' })).data.changed).toBe(false)

    expect((await call('schedule_post', { slug: 'via-mcp', at: '2020-01-01' })).data).toMatchObject({ state: 'live', changed: true })
    expect((await call('unpublish_post', { slug: 'via-mcp' })).data).toMatchObject({ state: 'draft', changed: true })
  })

  it('returns refusals as isError results', async () => {
    const missing = await call('get_post', { slug: 'ghost' })
    expect(missing.isError).toBe(true)
    expect(missing.data).toMatchObject({ ok: false, error: 'no-post' })
    const bad = await call('upsert_post', { title: 'T', body: 'x', publishAt: 'whenever' })
    expect(bad).toMatchObject({ isError: true, data: { ok: false, error: 'invalid' } })
  })
})
