import { defineEventHandler, setHeader } from 'h3'
import { queryLivePosts } from '../utils/posts'

// GET /api/_foundry/blog/posts — live posts, newest first. Evaluated per request.
export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'no-store')
  return queryLivePosts(event)
})
