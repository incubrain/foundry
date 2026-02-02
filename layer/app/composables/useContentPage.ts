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
 * Canonical, request-scoped content page context.
 *
 * - Set ONLY by layouts
 * - Read by pages/components
 * - Overwritten on every route change
 */
export const useContentPage = () =>
  useState<ContentPageContext | null>('content-page', () => null);
