// app/composables/useContentCache.ts
import { getCollectionName } from '#content-config';

/**
 * Centralized content queries with caching
 * Used across components to avoid duplicate fetches
 */
export const useContentCache = () => {
  const appConfig = useAppConfig();

  // Get collection names from config with fallbacks
  const collections = {
    faq: getCollectionName(appConfig.content?.collections?.faq, 'faq'),
    config: getCollectionName(appConfig.content?.collections?.config, 'config'),
    pages: getCollectionName(appConfig.content?.collections?.pages, 'pages'),
  };

  // Get routing config with fallbacks
  const routing = {
    offers: appConfig.content?.routing?.offers || '/offers',
  };

  /**
   * Get all FAQ sections
   */
  const getCachedFaqs = () => {
    return useAsyncData('app-cached-faqs', () =>
      queryCollection(collections.faq).all(),
    );
  };

  /**
   * Get site configuration
   */
  const getSiteConfig = () => {
    return useAsyncData('app-config', () =>
      queryCollection(collections.config)
        .where('stem', '=', 'config/site')
        .first(),
    );
  };

  /**
   * Get founder profile
   */
  const getFounder = () => {
    return useAsyncData('app-founder', async () => {
      const config = await queryCollection(collections.config)
        .where('stem', '=', 'config/site')
        .first();
      return config.founder;
    });
  };

  /**
   * Get offer by slug
   * @param slug - Offer slug (e.g., 'mentorship')
   * @param options - useAsyncData options
   */
  const getOffer = (
    slug: string,
    options?: { lazy?: boolean; server?: boolean },
  ) => {
    return useAsyncData(
      `offer-${slug}`,
      () =>
        queryCollection(collections.pages)
          .path(`${routing.offers}/${slug}`)
          .first(),
      {
        lazy: options?.lazy ?? true,
        server: options?.server ?? false,
      },
    );
  };

  /**
   * Get all offers (excluding success pages)
   */
  const getAllOffers = () => {
    // Extract the path without leading slash for stem matching
    const offersPath = routing.offers.replace(/^\//, '');
    return useAsyncData('all-offers', () =>
      queryCollection(collections.pages)
        .where('stem', 'LIKE', `${offersPath}/%`)
        .where('stem', 'NOT LIKE', '%success')
        .all(),
    );
  };

  return {
    getCachedFaqs,
    getSiteConfig,
    getFounder,
    getOffer,
    getAllOffers,
  };
};
