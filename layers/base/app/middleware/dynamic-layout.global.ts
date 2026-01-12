/**
 * Global middleware to dynamically set page layout based on route patterns
 *
 * Priority order:
 * 1. Page frontmatter (layout: "custom")
 * 2. Route pattern matching
 * 3. Default layout
 *
 * TODO: Migrate to routeRules.appLayout once Nuxt 4.3.0 released
 * @see https://github.com/nuxt/nuxt/pull/33894
 */

import type { LayoutKey } from '#build/types/layouts';

// Fallback to route pattern matching
const layoutMap: Record<string, LayoutKey> = {
  '/': 'default',
  '/founder': 'default',
  '/offers/**': 'offer',
  '/success': 'offer',
  '/success/**': 'offer',
  '/decisions': 'default',
  '/decisions/**': 'article',
};

function getLayoutForRoute(path: string): LayoutKey {
  if (layoutMap[path]) return layoutMap[path];

  for (const [pattern, layout] of Object.entries(layoutMap)) {
    if (pattern.includes('**')) {
      const regex = new RegExp('^' + pattern.replace('**', '.*') + '$');
      if (regex.test(path)) return layout;
    }
  }

  return 'default';
}

export default defineNuxtRouteMiddleware(async (to) => {
  // Check if page has explicit layout in frontmatter
  console.log('defineNuxtRouteMiddleware', to);
  if (to.meta.layout) {
    setPageLayout(to.meta.layout as LayoutKey);
    return;
  }

  setPageLayout(getLayoutForRoute(to.path));
});
