// layers/base/server/routes/rss/[collection].ts
export default defineEventHandler(async (event) => {
  const collection = getRouterParam(event, 'collection');

  if (!collection) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Collection not specified',
    });
  }

  // Get handler from registry (auto-imported)
  const handler = getRSSHandler(collection);

  if (!handler) {
    throw createError({
      statusCode: 404,
      statusMessage: `RSS feed not available for: ${collection}`,
    });
  }

  try {
    const feed = await handler(event);

    setHeader(event, 'Content-Type', 'application/xml; charset=utf-8');
    setHeader(event, 'Cache-Control', 'public, max-age=3600');

    return feed;
  } catch (error: any) {
    console.error(`[RSS] Error generating feed for "${collection}":`, error);
    throw createError({
      statusCode: 500,
      statusMessage: 'RSS generation failed',
    });
  }
});
