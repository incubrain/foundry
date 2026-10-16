#!/usr/bin/env node
// foundry-blog — git-based writer for a Foundry site's blog. Plain ESM (no
// TypeScript: it runs from node_modules, where Node will not strip types).
//
//   foundry-blog list | get <slug> | upsert (JSON on stdin) | schedule <slug> --at <iso> | unpublish <slug> | mcp
//   flags: --root <repo> --dir <content dir> --branch <name> --no-commit --push --author "Name <email>"
//
// stdout is ONE JSON object. Refusals are `{ok:false,error,message}` with exit 2.
import { parseArgs } from 'node:util'
import { BlogError, createStore } from '../modules/blog/core/store.mjs'

const OPTIONS = {
  'root': { type: 'string' },
  'dir': { type: 'string' },
  'branch': { type: 'string' },
  'author': { type: 'string' },
  'at': { type: 'string' },
  'push': { type: 'boolean' },
  'no-commit': { type: 'boolean' },
}

async function readStdin() {
  if (process.stdin.isTTY) throw new BlogError('invalid', 'upsert reads a JSON object from stdin')
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  }
  catch (error) {
    throw new BlogError('invalid', `stdin is not valid JSON: ${error.message}`)
  }
}

function need(positionals, what) {
  if (!positionals[1]) throw new BlogError('invalid', `${positionals[0]} needs a ${what}`)
  return positionals[1]
}

async function run(argv) {
  let parsed
  try {
    parsed = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true, strict: true })
  }
  catch (error) {
    throw new BlogError('invalid', error.message)
  }
  const { values, positionals } = parsed
  const store = createStore({
    root: values.root,
    dir: values.dir,
    branch: values.branch,
    author: values.author,
    push: values.push === true,
    commit: values['no-commit'] !== true,
  })

  switch (positionals[0]) {
    case 'list': return store.list()
    case 'get': return store.get(need(positionals, 'slug'))
    case 'upsert': return store.upsert(await readStdin())
    case 'schedule': return store.schedule(need(positionals, 'slug'), values.at)
    case 'unpublish': return store.unpublish(need(positionals, 'slug'))
    case 'mcp': {
      const { startMcp } = await import('../modules/blog/core/mcp.mjs')
      await startMcp(store)
      return null
    }
    default: throw new BlogError('invalid', 'usage: foundry-blog list | get <slug> | upsert | schedule <slug> --at <iso> | unpublish <slug> | mcp')
  }
}

try {
  const result = await run(process.argv.slice(2))
  if (result) process.stdout.write(`${JSON.stringify(result)}\n`)
}
catch (error) {
  const known = error instanceof BlogError
  const body = { ok: false, error: known ? error.code : 'error', message: error.message, ...(known ? error.extra : {}) }
  process.stdout.write(`${JSON.stringify(body)}\n`)
  process.exitCode = known ? 2 : 1
}
