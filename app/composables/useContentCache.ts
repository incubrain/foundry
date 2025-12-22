// app/composables/useContentCache.ts

/**
 * Centralized content queries with caching
 * Used across components to avoid duplicate fetches
 */
export const useContentCache = () => {
  /**
   * Get all FAQ sections
   */
  const getCachedFaqs = () => {
    return useAsyncData('app-cached-faqs', () =>
      queryCollection('faq').all()
    );
  };

  /**
   * Get site configuration
   */
  const getSiteConfig = () => {
    return useAsyncData('app-config', () =>
      queryCollection('config').where('stem', '=', 'config/site').first()
    );
  };

  /**
   * Get founder profile
   */
  const getFounder = () => {
  return useAsyncData('app-founder', async () => {
    const config = await queryCollection('config')
      .where('stem', '=', 'config/site')
      .first()
    return config.founder
  })
}

  /**
   * Get offer by slug
   * @param slug - Offer slug (e.g., 'mentorship')
   * @param options - useAsyncData options
   */
  const getOffer = (slug: string, options?: { lazy?: boolean; server?: boolean }) => {
    return useAsyncData(
      `offer-${slug}`,
      () => queryCollection('pages').path(`/offers/${slug}`).first(),
      {
        lazy: options?.lazy ?? true,
        server: options?.server ?? false,
      }
    );
  };

  /**
   * Get all offers (excluding success pages)
   */
  const getAllOffers = () => {
    return useAsyncData('all-offers', () =>
      queryCollection('pages')
        .where('stem', 'LIKE', 'offers/%')
        .where('stem', 'NOT LIKE', '%success')
        .all()
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
