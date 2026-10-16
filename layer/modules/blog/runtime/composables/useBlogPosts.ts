import type { BlogPost, BlogPostSummary } from '../types'

// Both read through Foundry's own endpoints (like useContentPage): liveness is
// decided there, per request, in JS — never in the client or in SQL.

/** Live posts, newest first. */
export const useBlogPosts = () =>
  useFetch<BlogPostSummary[]>('/api/_foundry/blog/posts', {
    key: 'foundry-blog-posts',
    default: () => [],
  })

/** One live post; `error` is a 404 when the slug is missing, a draft or still scheduled. */
export const useBlogPost = (slug: string) =>
  useFetch<BlogPost>('/api/_foundry/blog/post', {
    key: `foundry-blog-post-${slug}`,
    query: { slug },
  })
