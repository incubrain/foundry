export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const siteUrl = config.public.siteUrl || 'https://founder-funnel.incubrain.org';

  // Fetch site config for author info
  const siteConfig = await queryCollection(event, 'config').path('/config/site').first();
  const authorName = siteConfig?.founder?.given_name 
    ? `${siteConfig.founder.given_name} ${siteConfig.founder.surname}` 
    : 'Founder Funnel Team';

  // Fetch decisions
  const decisions = await queryCollection(event, 'pages')
    .select('path', 'title', 'description', 'date', 'label')
    .where('path', 'LIKE', '/decisions/%')
    .where('date', 'IS NOT NULL')
    .order('date', 'DESC')
    .limit(50)
    .all();

  // Helper to escape XML special characters
  function escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Build RSS items
  const rssItems = decisions
    .map(
      (d) => `
    <item>
      <title>${escapeXml(d.title)}</title>
      <link>${siteUrl}${d.path}</link>
      <guid isPermaLink="true">${siteUrl}${d.path}</guid>
      <pubDate>${new Date(d.date).toUTCString()}</pubDate>
      <description>${escapeXml(d.description || '')}</description>
      ${d.label ? `<category>${escapeXml(d.label)}</category>` : ''}
      <dc:creator>${escapeXml(authorName)}</dc:creator>
    </item>
  `,
    )
    .join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:dc="http://purl.org/dc/elements/1.1/" 
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Founder Funnel Decisions</title>
    <link>${siteUrl}/decisions</link>
    <description>Strategic decisions and validation learnings from building Founder Funnel</description>
    <language>en-us</language>
    <copyright>© ${new Date().getFullYear()} Founder Funnel. MIT License.</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>60</ttl>
    <image>
      <url>${siteUrl}/favicon-96x96.png</url>
      <title>Founder Funnel</title>
      <link>${siteUrl}/decisions</link>
      <width>96</width>
      <height>96</height>
    </image>
    <atom:link href="${siteUrl}/decisions.xml" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`;

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8');
  return rss;
});
