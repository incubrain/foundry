import { createResolver } from '@nuxt/kit';
import { ICON_LIBRARIES } from './shared/constants';
const { resolve } = createResolver(import.meta.url);

export default defineNuxtConfig({
  modules: [
    resolve('./modules/config'),
    resolve('./modules/css'),
    resolve('./modules/events'),
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxt/image',
    '@nuxtjs/robots',
    '@nuxtjs/mcp-toolkit',
    'nuxt-og-image',
    'nuxt-llms',
    '@nuxtjs/seo',
    'nuxt-studio',
    '@vueuse/nuxt',
    '@nuxt/scripts',
  ],

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
  },

  ui: {
    theme: {
      colors: [
        'primary',
        'secondary',
        'neutral',
        'info',
        'success',
        'warning',
        'error',
      ],
    },
  },

  router: {
    options: {
      scrollBehaviorType: 'smooth',
    },
  },

  css: [resolve('./app/assets/main.css'), 'katex/dist/katex.min.css'],

  dir: {
    assets: resolve('./app/assets'),
  },

  icon: {
    serverBundle: {
      // {DX}: Using full @iconify/json no need to install collection packages
      // collections array enables tree-shake
      collections: [...ICON_LIBRARIES],
    },
  },

  experimental: {
    asyncContext: true,
    defaults: {
      nuxtLink: {
        externalRelAttribute: 'noopener noreferrer',
        prefetch: false,
        prefetchOn: { interaction: true },
        trailingSlash: 'remove',
      },
    },
  },

  seo: {
    redirectToCanonicalSiteUrl: true,
  },

  hooks: {
    'components:extend': (components) => {
      const globals = components.filter((c) =>
        ['UButton', 'UIcon'].includes(c.pascalName),
      );
      globals.forEach((c) => (c.global = true));
    },
  },

  alias: {
    '#constants': resolve('./shared/constants.ts'),
    '#navigation': resolve('./shared/navigation.ts'),
    '#search': resolve('./shared/search.ts'),
    '#config-resolver': resolve('./shared/config-resolver.ts'),
    '#content-config': resolve('./shared/content-config.ts'),
  },

  content: {
    build: {
      markdown: {
        highlight: {
          langs: [
            'bash',
            'diff',
            'json',
            'js',
            'ts',
            'html',
            'css',
            'vue',
            'shell',
            'mdc',
            'md',
            'yaml',
          ],
        },
        remarkPlugins: {
          'remark-math': {},
          'remark-mdc': {
            options: {
              autoUnwrap: true,
            },
          },
        },
        rehypePlugins: {
          'rehype-katex': {},
        },
      },
    },
  },

  ssr: true,
  routeRules: {
    '/docs/**': {
      appLayout: 'docs',
    },
    '/rss/**': {
      swr: 3600,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    },
    // Landing pages
    '/': { appLayout: 'default', ssr: true, prerender: false },
    '/about': { appLayout: 'default', ssr: true, prerender: false },
    '/offers/**': { appLayout: 'conversion', ssr: true, prerender: false },
    '/success': { appLayout: 'conversion', ssr: true, prerender: false },
    '/success/**': { appLayout: 'conversion', ssr: true, prerender: false },

    // Documentation
    '/decisions': { appLayout: 'default', swr: 3600 },
    '/decisions/**': { appLayout: 'article', swr: 3600 },
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: false,
      autoSubfolderIndex: false,
    },
    compatibilityDate: {
      // Don't generate observability routes for now
      vercel: '2025-07-14',
    },
  },

  $development: {
    modules: ['@nuxt/eslint', '@compodium/nuxt', '@nuxt/hints'],

    devtools: { enabled: true },

    scripts: {
      registry: {
        umamiAnalytics: 'mock',
      },
    },

    nitro: {
      debug: true,
    },
  },

  $production: {
    sourcemap: false,
    experimental: {
      payloadExtraction: false,
    },

    scripts: {
      registry: {
        umamiAnalytics: true,
      },
    },

    nitro: {
      prerender: {
        routes: [],
        crawlLinks: false,
      },
    },
  },

  runtimeConfig: {
    public: {
      debug: true,
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
    webhookUrl: '',
    telegramChatId: '',
  },

  // Events module for conversion tracking
  events: {
    providers: ['umami', 'console', 'webhook'],
    webhook: {
      enabled: true,
      platforms: ['discord'],
    },
    debug: true,
  },

  compatibilityDate: '2026-01-20',
});
