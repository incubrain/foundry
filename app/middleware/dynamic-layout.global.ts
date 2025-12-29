/**
 * Global middleware to dynamically set page layout based on route patterns
 *
 * TODO: Migrate to routeRules.appLayout once Nuxt 4.3.0 released
 * @see https://github.com/nuxt/nuxt/pull/33894
 */

import type { LayoutKey } from '#build/types/layouts';

export default defineNuxtRouteMiddleware((to) => {
  const layoutMap: Record<string, LayoutKey> = {
    '/': 'default',
    '/founder': 'default', // ← Changed from 'about'
    '/offers/**': 'offer',
    '/success': 'offer', // ← Changed from 'success'
    '/success/**': 'offer', // ← Changed from 'success'
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

  setPageLayout(getLayoutForRoute(to.path));
});
