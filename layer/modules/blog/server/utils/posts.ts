import type { H3Event } from 'h3'
import type { Collections } from '@nuxt/content'
import { queryCollection } from '@nuxt/content/server'
import { isLive, parsePublishAt } from '../../core/post.mjs'
import type { BlogPost, BlogPostSummary, BlogRuntimeConfig } from '../../runtime/types'

/**
 * Liveness is decided HERE, in JS, per request: `isLive(row, new Date())`.
 * Never compare `publishAt` in SQL — the offset spellings ISO allows
 * (`Z`, `+05:30`, no offset) do not sort as strings, and the build-time DB is
 * the same for every request while "now" is not.
 */
type Row = BlogPostSummary & { draft?: boolean }
interface BlogQuery {
  select: (...fields: string[]) => BlogQuery
  path: (path: string) => BlogQuery
  all: () => Promise<Row[]>
  first: () => Promise<(Row & Partial<BlogPost>) | null>
}

const LIST_FIELDS = ['path', 'title', 'description', 'publishAt', 'draft', 'updatedAt', 'canonical', 'author', 'tags', 'image']

const blog = (event: H3Event) => queryCollection(event, 'blog' as keyof Collections) as unknown as BlogQuery

export const blogConfig = (event: H3Event) =>
  useRuntimeConfig(event).public.foundryBlog as BlogRuntimeConfig

const stamp = (post: Row) => parsePublishAt(post.publishAt)?.getTime() ?? 0

const toSummary = ({ draft: _draft, ...post }: Row): BlogPostSummary => post

/** Live posts, newest first. */
export async function queryLivePosts(event: H3Event, now = new Date()): Promise<BlogPostSummary[]> {
  const rows = await blog(event).select(...LIST_FIELDS).all()
  return rows.filter(row => isLive(row, now)).sort((a, b) => stamp(b) - stamp(a)).map(toSummary)
}

/** One post by content path, or null when it is missing or not live. */
export async function findLivePost(event: H3Event, path: string, now = new Date()): Promise<BlogPost | null> {
  const row = await blog(event).path(path).first()
  return row && isLive(row, now) ? (row as unknown as BlogPost) : null
}

/** Content paths of every post that is a draft or still scheduled. */
export async function hiddenPostPaths(event: H3Event, now = new Date()): Promise<Set<string>> {
  const rows = await blog(event).select('path', 'publishAt', 'draft').all()
  return new Set(rows.filter(row => !isLive(row, now)).map(row => row.path))
}

/** True when a post exists at `path` and is not live (also true when the lookup fails — fail closed). */
export async function isHiddenPost(event: H3Event, path: string, now = new Date()): Promise<boolean> {
  try {
    const row = await blog(event).path(path).select('path', 'publishAt', 'draft').first()
    return !!row && !isLive(row, now)
  }
  catch {
    return true
  }
}
