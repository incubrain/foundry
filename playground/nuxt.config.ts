export default defineNuxtConfig({
  extends: ['@incubrain/foundry'],

  // ---------------------------------------------------------------------------
  // Rendering-test routeRules
  //
  // Each rule exercises a specific Nuxt rendering knob. Tests in
  // `test/e2e/rendering.e2e.spec.ts` assert the observable behavior.
  // ---------------------------------------------------------------------------
  routeRules: {
    // Native Nuxt 4 feature: pick a layout via routeRules.
    // The layer's catch-all has no definePageMeta({ layout }), so this is the
    // primary way to assign layouts to content-driven URLs.
    '/render-article': { appLayout: 'article' },

    // Force prerender for a specific route (SSG slice inside an otherwise SSR site).
    '/render-default': { prerender: true },

    // Custom response headers (mirrors incubrain `/internal/**` noindex pattern).
    '/render-headers': {
      headers: { 'x-foundry-test': 'route-rules-headers' },
    },

    // Redirect rule.
    '/render-redirect': { redirect: '/render-default' },
  },

  nitro: {
    prerender: {
      // Explicit prerender targets — verified in prerender.e2e.spec.ts.
      routes: ['/render-default'],
      crawlLinks: false,
      failOnError: false,
    },
  },

  // `/render-headers` is a headers-only routeRules fixture with no page behind it
  // (it 404s by design — the e2e test reads only the response header), so keep it
  // out of /sitemap.xml where crawlers and the smoke runners would follow it.
  sitemap: {
    exclude: ['/render-headers'],
  },
})
