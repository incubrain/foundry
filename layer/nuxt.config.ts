import { join } from 'node:path'
import { createResolver, useNuxt } from '@nuxt/kit'
import { defineNuxtConfig } from 'nuxt/config'
import { ICON_LIBRARIES } from './shared/constants'

const { resolve } = createResolver(import.meta.url)

const isCI = process.env.CI === 'true'
const ciPrerender = process.env.CI_PRERENDER === 'true'

export default defineNuxtConfig({
  modules: [
    resolve('./modules/config'),
    resolve('./modules/css'),
    resolve('./modules/ai-robots'),
    resolve('./modules/events'),
    resolve('./modules/rss'),
    // Order matters: markdown-rewrite's Nitro middleware CLOSES the request for
    // a matched `.md`/`Accept: text/markdown` route, so it must stay after
    // ./modules/events — agent traffic has to reach the signal middleware first.
    resolve('./modules/markdown-rewrite'),
    () => {
      // Auto-register the consumer's app/assets/icons/ SVGs under the `custom:` prefix.
      // Drop SVG files in <consumer>/app/assets/icons/ and use them as `i-custom:<name>`.
      // Adopted from upstream docus #1288.
      const nuxt = useNuxt()
      nuxt.options.icon ||= {}
      nuxt.options.icon.customCollections ||= []
      nuxt.options.icon.customCollections.push({
        prefix: 'custom',
        dir: join(nuxt.options.srcDir, 'assets/icons'),
      })
    },
    '@nuxt/ui',
    '@nuxtjs/seo',
    '@nuxt/content',
    // Ships /llms.txt + /llms-full.txt with zero per-site config
    // (product-validator-m0f.9). @nuxt/content auto-populates `llms.sections`
    // from every page-type content collection as long as the consumer hasn't
    // declared their own sections — see modules/config.ts for the domain/
    // title/description defaults that make the module actually register its
    // routes (it silently no-ops without a `domain`).
    'nuxt-llms',
    '@nuxt/image',
    '@nuxtjs/mcp-toolkit',
    '@vueuse/nuxt',
    '@nuxt/test-utils/module',
  ],

  $development: {
    modules: ['@nuxt/eslint', '@compodium/nuxt', '@nuxt/hints'],

    devtools: { enabled: true },

    runtimeConfig: {
      public: {
        debug: true,
      },
    },

    nitro: {
      debug: true,
    },

    // Console echo of every event — dev only. Live consumer sites must stay quiet.
    events: {
      debug: true,
    },
  },

  $production: {
    sourcemap: false,
    experimental: {
      payloadExtraction: false,
    },

    nitro: {
      prerender: {
        routes: ciPrerender ? ['/'] : [],
        crawlLinks: ciPrerender,
      },
    },
  },

  ssr: true,

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
  },

  css: [resolve('./app/assets/main.css')],

  router: {
    options: {
      scrollBehaviorType: 'smooth',
    },
  },

  content: {
    experimental: { sqliteConnector: 'native' },
    build: {
      markdown: {
        highlight: {
          theme: {
            default: 'andromeeda',
            dark: 'github-dark',
          },
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
          'remark-mdc': {
            options: {
              autoUnwrap: true,
            },
          },
        },
      },
    },
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

  runtimeConfig: {
    public: {
      debug: false, // true only under $development (above)
      siteUrl: '',
      siteId: '', // NUXT_PUBLIC_SITE_ID — stamped on every signal row (falls back to request host)
      signalEnv: '', // NUXT_PUBLIC_SIGNAL_ENV — override for the env:'local' debug marker (see events/AGENTS.md)
    },
    signalExportToken: '', // NUXT_SIGNAL_EXPORT_TOKEN — bearer token for GET /api/_signals/export
  },

  dir: {
    assets: resolve('./app/assets'),
  },

  alias: {
    '#constants': resolve('./shared/constants.ts'),
    '#navigation': resolve('./app/composables/useNavigation.ts'),
    '#search': resolve('./app/composables/useSearch.ts'),
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

  compatibilityDate: '2026-01-20',

  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: isCI,
      autoSubfolderIndex: false,
      ignore: ['/__og-image__', '/_ipx'],
    },
    compatibilityDate: {
      // Don't generate observability routes for now
      vercel: '2025-07-14',
    },
  },

  typescript: {
    tsConfig: {
      include: ['../test/**/*'],
    },
  },

  hooks: {
    'components:extend': (
      components: { pascalName: string, global?: boolean | 'sync' }[],
    ) => {
      const globals = components.filter((c: { pascalName: string }) =>
        ['UButton', 'UIcon'].includes(c.pascalName),
      )
      globals.forEach((c: { global?: boolean | 'sync' }) => (c.global = true))
    },
  },

  // robots.txt AI policy — answer engines always allowed (AI-answer visibility),
  // training crawlers a per-site call. Override `training: 'disallow'` in the
  // consumer's nuxt.config to keep a site out of training corpora.
  aiRobots: {
    training: 'allow',
  },

  // Signal capture — client events + errors → ring buffer → /api/_signals/export
  events: {
    signals: {
      enabled: true,
      // Sized for the always-on identity stream — see DEFAULT_SIGNAL_CAPACITY
      // in modules/events/server/utils/signal-buffer.ts for the arithmetic.
      capacity: 170_000,
      captureErrors: true,
    },
    debug: false, // echo is dev-only: `$development.events.debug`
  },

  icon: {
    serverBundle: {
      // Install individual @iconify-json/* packages (optional peer deps)
      // Override ICON_LIBRARIES in shared/constants.ts to use different icon sets
      collections: [...ICON_LIBRARIES],
    },
  },
  linkChecker: {
    failOnError: isCI,
    excludeLinks: ['/pdfs/**'],
  },
  seo: {
    redirectToCanonicalSiteUrl: true,
  },
})
