import { inject, type Ref } from 'vue';
import type { ContentNavigationItem, Collections } from '@nuxt/content';

/**
 * Collection config can be a string (name only) or object with routing info
 */
type CollectionConfig =
  | keyof Collections
  | {
      name: keyof Collections;
      prefix?: string;
      backLabel?: string;
    };

/**
 * Route pattern config for mapping routes to collections
 */
interface RoutePatternConfig {
  pattern: string;
  collection: keyof Collections;
}

/**
 * Centralized composable for content configuration and path resolution.
 * All collection name/prefix/routing logic lives here.
 */
export const useContentConfig = () => {
  const appConfig = useAppConfig();

  /* -------------------------------------------------------------------------- */
  /*                          COLLECTION CONFIG HELPERS                         */
  /* -------------------------------------------------------------------------- */

  /**
   * Extract collection name from config (handles both string and object formats)
   */
  const getCollectionName = (
    key: keyof Collections,
    fallback?: string,
  ): keyof Collections => {
    const config = appConfig.content?.collections?.[key] as
      | CollectionConfig
      | undefined;
    const defaultFallback = (fallback ?? key) as keyof Collections;
    if (!config) return defaultFallback;
    if (typeof config === 'string') return config;
    return config.name || defaultFallback;
  };

  /**
   * Extract collection URL prefix from config
   */
  const getCollectionPrefix = (
    key: keyof Collections,
    fallback = '',
  ): string => {
    const config = appConfig.content?.collections?.[key] as
      | CollectionConfig
      | undefined;
    if (!config) return fallback;
    if (typeof config === 'string') return fallback;
    return config.prefix ?? fallback;
  };

  /**
   * Extract collection back label from config (for navigation)
   */
  const getCollectionBackLabel = (
    key: keyof Collections,
    fallback = 'Back',
  ): string => {
    const config = appConfig.content?.collections?.[key] as
      | CollectionConfig
      | undefined;
    if (!config) return fallback;
    if (typeof config === 'string') return fallback;
    return config.backLabel ?? fallback;
  };

  /**
   * Get routing path from content.routing config
   */
  const getRoutingPath = (key: string, fallback: string): string => {
    return appConfig.content?.routing?.[key] || fallback;
  };

  /**
   * Get searchable collections array
   */
  const getSearchableCollections = (): string[] => {
    return appConfig.content?.collections?.searchable || ['docs'];
  };

  /* -------------------------------------------------------------------------- */
  /*                          ROUTE → COLLECTION MAPPING                        */
  /* -------------------------------------------------------------------------- */

  /**
   * Build route patterns from collection prefixes in app.config.ts
   * Returns patterns sorted by specificity (longest prefix first)
   */
  const getRoutePatterns = (): RoutePatternConfig[] => {
    const collectionsConfig = appConfig.content?.collections;
    if (!collectionsConfig) return [];

    const patterns: RoutePatternConfig[] = [];

    // Extract patterns from collection configs
    for (const [key, config] of Object.entries(collectionsConfig)) {
      // Skip non-collection entries like 'searchable'
      if (key === 'searchable') continue;

      if (typeof config === 'object' && config !== null && 'prefix' in config) {
        const prefix = config.prefix as string;
        if (prefix) {
          patterns.push({
            pattern: prefix,
            collection: (config.name || key) as keyof Collections,
          });
        }
      }
    }

    // Sort by prefix length descending (more specific patterns first)
    return patterns.sort((a, b) => b.pattern.length - a.pattern.length);
  };

  /**
   * Determine which collection a route belongs to based on path patterns.
   * Uses collection prefixes from app.config.ts to match routes dynamically.
   *
   * @param path - The route path to match (e.g., '/darksky/intro')
   * @returns The collection key that should be queried
   */
  const getCollectionForRoute = (path: string): keyof Collections => {
    const patterns = getRoutePatterns();

    // Match against configured prefixes
    for (const { pattern, collection } of patterns) {
      // Pattern match: exact prefix or prefix followed by /
      if (path === pattern || path.startsWith(`${pattern}/`)) {
        return collection;
      }
    }

    // Fallback: check content.routing for special routes
    const routingConfig = appConfig.content?.routing;
    if (routingConfig) {
      for (const [, routePath] of Object.entries(routingConfig)) {
        if (typeof routePath === 'string') {
          if (path === routePath || path.startsWith(`${routePath}/`)) {
            return 'pages' as keyof Collections;
          }
        }
      }
    }

    // Default fallback to pages collection
    return 'pages' as keyof Collections;
  };

  /* -------------------------------------------------------------------------- */
  /*                              PATH RESOLUTION                               */
  /* -------------------------------------------------------------------------- */

  const seperatePathAndHash = (
    path: string,
  ): { path: string; hash: string } => {
    const hashIndex = path.indexOf('#');
    return hashIndex !== -1
      ? { path: path.slice(0, hashIndex), hash: path.slice(hashIndex) }
      : { path, hash: '' };
  };

  /**
   * Resolve an internal path to include the docs prefix.
   * Handles edge cases:
   * - Path already includes the prefix → returns as-is
   * - Path with/without leading slash → normalizes correctly
   * - Empty or invalid paths → returns safe fallback
   * - Hash fragments → preserved
   */
  const resolveInternalPath = (path: string): string => {
    if (!path) return '/';

    const prefix = getCollectionPrefix('docs', '');

    // Separate hash fragment if present
    const { path: pathWithoutHash, hash } = seperatePathAndHash(path);

    // Normalize path to have leading slash
    const normalizedPath = pathWithoutHash.startsWith('/')
      ? pathWithoutHash
      : `/${pathWithoutHash}`;

    // If no prefix configured, just return the normalized path
    if (!prefix) return `${normalizedPath}${hash}`;

    // Check if path already starts with the prefix (avoid duplication)
    if (normalizedPath.startsWith(prefix)) {
      return `${normalizedPath}${hash}`;
    }

    // Check if path starts with prefix without leading slash (e.g., "docs/page" when prefix is "/docs")
    const prefixWithoutSlash = prefix.replace(/^\//, '');
    if (normalizedPath.slice(1).startsWith(prefixWithoutSlash)) {
      return `${normalizedPath}${hash}`;
    }

    return `${prefix}${normalizedPath}${hash}`;
  };

  /* -------------------------------------------------------------------------- */
  /*                            NAVIGATION HELPERS                              */
  /* -------------------------------------------------------------------------- */

  /**
   * Flatten navigation tree for searching
   */
  const flattenNavigation = (
    items?: ContentNavigationItem[],
  ): ContentNavigationItem[] =>
    items?.flatMap((item) =>
      item.children ? flattenNavigation(item.children) : [item],
    ) || [];

  /**
   * Get page metadata from navigation by path
   * Uses injected navigation data from app.vue
   */
  const getPageMetadata = (path: string) => {
    const navigationAll =
      inject<Ref<ContentNavigationItem[]>>('navigation_all');
    if (!navigationAll?.value) return null;
    // Flatten and search

    const { path: pathWithoutHash } = seperatePathAndHash(path);
    const normalizedPath = resolveInternalPath(pathWithoutHash);

    // Try exact match
    const flatNav = flattenNavigation(navigationAll.value);
    const match = flatNav.find((item) => item.path === normalizedPath);
    if (match) return match;

    // Handle potential trailing slash differences
    return flatNav.find(
      (item) =>
        item.path?.replace(/\/$/, '') === normalizedPath.replace(/\/$/, ''),
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                              CONVENIENCE GETTERS                           */
  /* -------------------------------------------------------------------------- */

  // Pre-resolved collection names for common use cases
  const collections = {
    docs: getCollectionName('docs'),
    pages: getCollectionName('pages'),
    references: getCollectionName('references'),
    glossary: getCollectionName('glossary'),
    faq: getCollectionName('faq'),
    config: getCollectionName('config'),
    navigation: getCollectionName('navigation'),
  };

  // Pre-resolved routing paths
  const routing = {
    docsPrefix: getCollectionPrefix('docs', ''),
    pagesPrefix: getCollectionPrefix('pages', '/articles'),
    pagesBackLabel: getCollectionBackLabel('pages', 'Back to Articles'),
    glossaryPrefix: getCollectionPrefix('glossary', '/glossary'),
    offers: getRoutingPath('offers', '/offers'),
    success: getRoutingPath('success', '/success'),
    sources: getRoutingPath('sources', '/sources'),
  };

  return {
    // Config helpers (for dynamic lookups)
    getCollectionName,
    getCollectionPrefix,
    getCollectionBackLabel,
    getRoutingPath,
    getSearchableCollections,

    // Route → Collection mapping
    getRoutePatterns,
    getCollectionForRoute,

    // Path resolution
    resolveInternalPath,

    // Navigation helpers
    flattenNavigation,
    getPageMetadata,

    // Pre-resolved values (for convenience)
    collections,
    routing,
  };
};
