import type { PageCollections } from '@nuxt/content';

export interface ContentPageContext {
  /** Which content collection produced this page */
  collection: string;

  /** The actual page document (Nuxt Content item) */
  page: any | null;

  /** Optional navigation tree (docs sidebar, etc.) */
  navigation?: any;

  /** Optional prev/next surround data */
  surround?: any;

  /** Optional SEO overrides */
  seo?: {
    title?: string;
    description?: string;
  };

  /** Arbitrary extra metadata (edit links, flags, etc.) */
  meta?: Record<string, any>;
}

/**
 * Unified content page composable.
 *
 * Handles:
 * - Route-based collection resolution (from app.config.ts)
 * - Page data fetching via useAsyncData
 * - Shared state for layouts/pages/components
 *
 * Usage:
 * ```ts
 * const { page, collection, context } = useContentPage();
 * ```
 */
export const useContentPage = () => {
  const route = useRoute();
  const { getCollectionForRoute } = useContentConfig();

  // Shared state (for components that need access without re-fetching)
  const context = useState<ContentPageContext | null>('content-page', () => null);

  // Dynamically determine collection based on route
  const collection = computed(
    () => getCollectionForRoute(route.path) as keyof PageCollections,
  );

  // Clear context immediately when route changes (before new data loads)
  watch(
    () => route.path,
    () => {
      context.value = null;
    },
  );

  /**
   * Fetch page data for the current route.
   * Wraps useAsyncData with automatic collection resolution.
   */
  const getPage = () => {
    return useAsyncData(
      () => `page-${collection.value}-${route.path}`,
      () => {
        console.log('[useContentPage] Querying:', collection.value, route.path);
        return queryCollection(collection.value).path(route.path).first();
      },
      {
        watch: [() => route.path, collection],
      },
    );
  };

  /**
   * Update the shared context (call after fetching page data).
   * Automatically extracts SEO fields from page.
   */
  const setContext = (
    page: any,
    extras?: Partial<Omit<ContentPageContext, 'collection' | 'page' | 'seo'>>,
  ) => {
    if (!page) {
      context.value = null;
      return;
    }

    context.value = {
      collection: collection.value,
      page,
      seo: {
        title: page.seo?.title || page.title,
        description: page.seo?.description || page.description,
      },
      ...extras,
    };
  };

  return {
    /** Current collection (computed from route) */
    collection,

    /** Fetch page data for current route */
    getPage,

    /** Update shared context after fetching */
    setContext,

    /** Shared context state (read-only for components) */
    context,
  };
};
