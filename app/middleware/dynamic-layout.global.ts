/**
 * Global middleware to dynamically set page layout based on route patterns
 *
 * TODO: Migrate to routeRules.appLayout once Nuxt 4.3.0 released
 * @see https://github.com/nuxt/nuxt/pull/33894
 */

import type { LayoutKey } from '#build/types/layouts';

export default defineNuxtRouteMiddleware((to) => {
  // Layout mapping: Route patterns → Layout names
  const layoutMap: Record<string, LayoutKey> = {
    '/': 'default',
    '/about': 'about',
    '/offers/**': 'offer',
    '/success': 'success',
    '/success/**': 'success',
    '/decisions': 'decisions',
    '/decisions/**': 'article',
  };

  /**
   * Determine layout based on route path
   */
  function getLayoutForRoute(path: string): LayoutKey {
    // Exact matches first
    if (layoutMap[path]) {
      return layoutMap[path];
    }

    // Pattern matches (glob-style **)
    for (const [pattern, layout] of Object.entries(layoutMap)) {
      if (pattern.includes('**')) {
        const regex = new RegExp('^' + pattern.replace('**', '.*') + '$');
        if (regex.test(path)) {
          return layout;
        }
      }
    }

    // Default fallback
    return 'default';
  }

  // Set layout dynamically based on target route
  setPageLayout(getLayoutForRoute(to.path));
});
