import { defineEventHandler, getRequestURL, setHeader } from 'h3'
import { buildRSSFeed } from '../../../rss/server/utils/rss-feed'
import { blogConfig, queryLivePosts } from '../utils/posts'

// GET <prefix>/rss.xml — the live posts only, newest first.
export default defineEventHandler(async (event) => {
  const { prefix, title } = blogConfig(event)
  const site = getSiteConfig(event)
  const base = site.url || getRequestURL(event).origin
  const posts = (await queryLivePosts(event)).slice(0, 50)

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=300')
  return buildRSSFeed({
    title: site.name ? `${site.name} ${title}` : title,
    link: `${base}${prefix}`,
    description: site.description || title,
    items: posts.map(post => ({
      title: post.title,
      link: `${base}${post.path}`,
      guid: `${base}${post.path}`,
      pubDate: new Date(post.publishAt).toUTCString(),
      description: post.description,
      author: post.author,
    })),
  }, base)
})
