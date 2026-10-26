// Stdio MCP server over the blog store — the same functions the CLI calls.
// stdout is the protocol channel: nothing here may write to it directly.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { BlogError } from './store.mjs'
import { postInputSchema } from './post.mjs'

function reply(run) {
  try {
    return { content: [{ type: 'text', text: JSON.stringify(run()) }] }
  }
  catch (error) {
    const known = error instanceof BlogError
    const body = { ok: false, error: known ? error.code : 'error', message: error.message, ...(known ? error.extra : {}) }
    return { isError: true, content: [{ type: 'text', text: JSON.stringify(body) }] }
  }
}

/** Connect an MCP server for `store` to stdin/stdout; resolves once connected. */
export async function startMcp(store) {
  const server = new McpServer({ name: 'foundry-blog', version: '1.0.0' })
  const slug = z.string().describe('post slug (file name without .md)')

  server.registerTool('list_posts', {
    description: 'List blog posts with their state (draft | scheduled | live), newest first.',
  }, () => reply(() => store.list()))

  server.registerTool('get_post', {
    description: 'Read one post: frontmatter, markdown body and state.',
    inputSchema: { slug },
  }, args => reply(() => store.get(args.slug)))

  server.registerTool('upsert_post', {
    description: 'Create or update a post and commit it. publishAt (ISO 8601, default now on create) decides when it goes live; draft:true keeps it unpublished. Absent fields keep their stored value; null clears one.',
    inputSchema: postInputSchema().shape,
  }, args => reply(() => store.upsert(args)))

  server.registerTool('schedule_post', {
    description: 'Set when a post goes live (ISO 8601; no offset means UTC) and clear its draft flag.',
    inputSchema: { slug, at: z.string().describe('ISO 8601 date or datetime') },
  }, args => reply(() => store.schedule(args.slug, args.at)))

  server.registerTool('unpublish_post', {
    description: 'Mark a post as a draft so it is no longer live.',
    inputSchema: { slug },
  }, args => reply(() => store.unpublish(args.slug)))

  await server.connect(new StdioServerTransport())
  return server
}
