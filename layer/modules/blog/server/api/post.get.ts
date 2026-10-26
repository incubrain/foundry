import { createError, defineEventHandler, getQuery, setHeader } from 'h3'
import { isSlug } from '../../core/post.mjs'
import { blogConfig, findLivePost } from '../utils/posts'

// GET /api/_foundry/blog/post?slug=… — one live post; 404 for missing, draft and scheduled alike.
export default defineEventHandler(async (event) => {
  const slug = String(getQuery(event).slug ?? '')
  const post = isSlug(slug) ? await findLivePost(event, `${blogConfig(event).prefix}/${slug}`) : null
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  setHeader(event, 'cache-control', 'no-store')
  return post
})
