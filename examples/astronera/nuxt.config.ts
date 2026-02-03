import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

const SITE_URL = 'https://astronera.org'

export default defineNuxtConfig({
  extends: ['@incubrain/foundry'],

  modules: ['nuxt-studio', 'nuxt-llms'],

  css: [resolve('./app/assets/theme.css')],

  site: {
    name: 'AstronEra',
    url: SITE_URL,
  },

  mdc: {
    components: {
      map: {
        cited: 'Cited',
        defn: 'Defn',
      },
    },
  },

  routeRules: {
    '/': {
      appLayout: 'default',
    },
    '/darksky/**': {
      appLayout: 'docs',
    },
    '/resources/**': {
      appLayout: 'default',
    },
  },

  nitro: {
    routeRules: {
      // DOI links redirect to documents page with anchors
      '/doi/dsi-acknowledgement': {
        redirect: '/resources/sources',
      },
      '/doi/dsi-endorsement': { redirect: '/resources/sources' },
      '/doi/idspac-2023': { redirect: '/resources/sources' },
      '/doi/symposium-2025': { redirect: '/resources/sources' },
      '/doi/astrotribe-nashik-2023': { redirect: '/resources/sources' },
      '/doi/astrotribe-ladakh-2024': { redirect: '/resources/sources' },
    },
  },

  vite: {
    server: {
      fs: {
        allow: [
          // pnpm workspace HRM fix
          resolve('../../'),
          resolve('../../layer'),
        ],
      },
      watch: {
        // critical for pnpm + symlinks
        followSymlinks: true,
      },
    },
  },

  llms: {
    domain: SITE_URL,
    title: 'Dark Sky Conservation in Maharashtra',
    description: 'Dark Sky Conservation in Maharashtra',
    notes: [
      'The documentation only includes Dark Sky Conservation in Maharashtra docs.',
      'The content is automatically generated from the same source as the official documentation.',
    ],
    full: {
      title: 'Complete Documentation',
      description: 'The complete documentation including all content',
    },
  },

  studio: {
    meta: {
      components: {
        include: ['Cited', 'Defn'],
      },
    },
    route: '/admin',
    repository: {
      provider: 'github',
      owner: 'incubrain',
      repo: 'foundry',
      branch: 'main',
      rootDir: resolve('./'),
      private: false,
    },
  },
})
