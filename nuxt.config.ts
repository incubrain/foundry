// https://nuxt.com/docs/api/configuration/nuxt-config
import { getActiveConfigSource } from './shared/utils/config-resolver';

const { prefix } = getActiveConfigSource();

const EXTENDS = `./${prefix}`;

export default defineNuxtConfig({
  extends: [EXTENDS],

  $development: {
    modules: ['@nuxt/eslint', '@compodium/nuxt', '@nuxt/hints'],

    devtools: { enabled: true },

    scripts: {
      registry: {
        umamiAnalytics: 'mock',
      },
    },

    // Dev-specific Nitro config
    nitro: {
      debug: true,
    },
  },

  // {PERF}: Production only performance optimizations
  $production: {
    sourcemap: false,
    experimental: {
      payloadExtraction: false, // Faster builds
    },

    scripts: {
      registry: {
        umamiAnalytics: true,
      },
    },

    nitro: {
      prerender: {
        // Intentionally empty - dynamic routes are not prerendered
        routes: [],
        crawlLinks: false,
      },
    },
  },

  runtimeConfig: {
    public: {
      debug: true,
      analyticsLink: '',
      configSource: '',
      siteUrl: '',
      scripts: {
        umamiAnalytics: {
          websiteId: '',
          scriptInput: {
            src: '',
          },
        },
      },
    },
    // Server-only config (not exposed to client)
    webhookUrl: '',
    telegramChatId: '',
  },

  events: {
    providers: ['umami', 'console', 'webhook'],
    webhook: {
      enabled: true,
      platforms: ['discord'], // Default, override with env if needed
    },
    debug: true,
  },

  routeRules: {
    '/': { ssr: true, prerender: false },
    '/offers/**': { ssr: true, prerender: false },
    '/success': { ssr: true, prerender: false },
    '/success/**': { ssr: true, prerender: false },
    '/about': { ssr: true, prerender: false },
    '/decisions': { swr: 3600 },
    '/decisions/**': { swr: 3600 },
    '/rss/**': {
      swr: 3600,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    },
  },
});
