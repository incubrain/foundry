import type { H3Event } from 'h3';
import {
  buildRSSFeed,
  getAuthorName,
  getBusinessName,
  type RSSItem,
} from './shared';

// Export as named function (not default export)
export async function generateDecisionsFeed(event: H3Event): Promise<string> {
  const { getSiteConfig } = await import('#site-config/server/composables');

  const siteConfig = getSiteConfig(event);

  const authorName = await getAuthorName(event);
  const businessName = await getBusinessName(event);

  // Get articles config from appConfig (with fallback)
  // Pages collection can be string or { name, prefix, backLabel }
  const appConfig = useAppConfig();
  const pagesConfig = appConfig.content?.collections?.pages;
  const articlesBasePath =
    typeof pagesConfig === 'object'
      ? pagesConfig?.prefix || '/articles'
      : '/articles';

  // Fetch articles
  const articles = await queryCollection(event, 'pages')
    .select('path', 'title', 'description', 'date', 'label')
    .where('path', 'LIKE', `${articlesBasePath}/%`)
    .where('date', 'IS NOT NULL')
    .order('date', 'DESC')
    .limit(50)
    .all();

  // Transform to RSS items
  const items: RSSItem[] = articles.map((d: any) => ({
    title: d.title,
    link: `${siteConfig.url}${d.path}`,
    guid: `${siteConfig.url}${d.path}`,
    pubDate: new Date(d.date).toUTCString(),
    description: d.description || '',
    category: d.label || undefined,
    author: authorName,
  }));

  // Build RSS feed
  return buildRSSFeed(
    {
      title: `${businessName} Articles`,
      link: `${siteConfig.url}${articlesBasePath}`,
      description: `Latest articles and updates from ${businessName}`,
      items,
    },
    siteConfig.url,
  );
}
