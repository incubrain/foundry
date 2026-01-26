// Helper utilities for working with content collection configuration
// Collections can be configured as either a string (name only) or object { name, prefix?, backLabel? }

type CollectionConfig =
  | string
  | {
      name: string;
      prefix?: string;
      backLabel?: string;
    };

/**
 * Extract collection name from config (handles both string and object formats)
 */
export function getCollectionName(config: CollectionConfig | undefined, fallback: string): string {
  if (!config) return fallback;
  if (typeof config === 'string') return config;
  return config.name || fallback;
}

/**
 * Extract collection URL prefix from config
 */
export function getCollectionPrefix(config: CollectionConfig | undefined, fallback = ''): string {
  if (!config) return fallback;
  if (typeof config === 'string') return fallback;
  return config.prefix ?? fallback;
}

/**
 * Extract collection back label from config (for navigation)
 */
export function getCollectionBackLabel(
  config: CollectionConfig | undefined,
  fallback = 'Back',
): string {
  if (!config) return fallback;
  if (typeof config === 'string') return fallback;
  return config.backLabel ?? fallback;
}
