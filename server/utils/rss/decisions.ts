// layers/base/server/utils/rss/decisions.ts
import type { H3Event } from 'h3';
import { buildRSSFeed, getAuthorName, type RSSItem } from './shared';

// Export as named function (not default export)
export async function generateDecisionsFeed(event: H3Event): Promise<string> {
  const config = useRuntimeConfig();
  const siteUrl = config.public.siteUrl;
  const authorName = await getAuthorName(event);

  // Fetch decisions
  const decisions = await queryCollection(event, 'pages')
    .select('path', 'title', 'description', 'date', 'label')
    .where('path', 'LIKE', '/decisions/%')
    .where('date', 'IS NOT NULL')
    .order('date', 'DESC')
    .limit(50)
    .all();

  // Transform to RSS items
  const items: RSSItem[] = decisions.map((d) => ({
    title: d.title,
    link: `${siteUrl}${d.path}`,
    guid: `${siteUrl}${d.path}`,
    pubDate: new Date(d.date).toUTCString(),
    description: d.description || '',
    category: d.label || undefined,
    author: authorName,
  }));

  // Build RSS feed
  return buildRSSFeed(
    {
      title: 'Founder Funnel Decisions',
      link: `${siteUrl}/decisions`,
      description:
        'Strategic decisions and validation learnings from building Founder Funnel',
      items,
    },
    siteUrl,
  );
}
