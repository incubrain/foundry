// layers/docs/server/utils/rss-handlers.ts
import type { H3Event } from 'h3'
import { generateDecisionsFeed } from './rss/decisions'
// Import future handlers here:
// import { generateBlogFeed } from './rss/blog'

export type RSSHandler = (event: H3Event) => Promise<string>

// Static registry of available handlers
export const RSS_HANDLERS: Record<string, RSSHandler> = {
  decisions: generateDecisionsFeed,
  // Future handlers:
  // blog: generateBlogFeed,
  // updates: generateUpdatesFeed,
}

// Helper to get handler by collection name
export function getRSSHandler(collection: string): RSSHandler | null {
  return RSS_HANDLERS[collection] || null
}
