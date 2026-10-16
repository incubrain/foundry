import { createError, defineEventHandler, getQuery, getRequestURL } from 'h3'
import { guardTarget } from '../utils/guard'
import { blogConfig, isHiddenPost } from '../utils/posts'

// 404 for any route that would serve a draft or scheduled post's source.
// Closes @nuxt/content's `/raw/<path>.md` and the layer's generic page endpoint.
export default defineEventHandler(async (event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return

  const target = guardTarget(getRequestURL(event).pathname, getQuery(event), blogConfig(event).prefix)
  if (!target) return
  if (target === 'deny' || await isHiddenPost(event, target)) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }
})
