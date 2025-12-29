// layers/base/server/utils/rss/shared.ts
import type { H3Event } from 'h3';

export interface RSSItem {
  title: string;
  link: string;
  guid: string;
  pubDate: string;
  description?: string;
  category?: string;
  author?: string;
}

export interface RSSChannel {
  title: string;
  link: string;
  description: string;
  items: RSSItem[];
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildRSSFeed(channel: RSSChannel, siteUrl: string): string {
  const rssItems = channel.items
    .map((item) => {
      const category = item.category
        ? `<category>${escapeXml(item.category)}</category>`
        : '';
      const author = item.author
        ? `<dc:creator>${escapeXml(item.author)}</dc:creator>`
        : '';
      const description = item.description
        ? `<description>${escapeXml(item.description)}</description>`
        : '';

      return `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.guid}</guid>
      <pubDate>${item.pubDate}</pubDate>
      ${description}
      ${category}
      ${author}
    </item>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:dc="http://purl.org/dc/elements/1.1/" 
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channel.title)}</title>
    <link>${channel.link}</link>
    <description>${escapeXml(channel.description)}</description>
    <language>en-us</language>
    <copyright>© ${new Date().getFullYear()} ${escapeXml(channel.title)}</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>60</ttl>
    <image>
      <url>${siteUrl}/favicon-96x96.png</url>
      <title>${escapeXml(channel.title)}</title>
      <link>${channel.link}</link>
      <width>96</width>
      <height>96</height>
    </image>
    <atom:link href="${siteUrl}/rss/${channel.title.toLowerCase().replace(/\s+/g, '-')}" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`;
}

export async function getAuthorName(event: H3Event): Promise<string> {
  const siteConfig = await queryCollection(event, 'config')
    .where('stem', '=', 'config/site')
    .first();

  return siteConfig?.founder?.given_name
    ? `${siteConfig.founder.given_name} ${siteConfig.founder.surname}`
    : 'Founder Funnel Team';
}
