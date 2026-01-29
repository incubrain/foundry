import { createResolver } from '@nuxt/kit';

const { resolve } = createResolver(import.meta.url);

const SITE_URL = 'https://astronera.org';

export default defineNuxtConfig({
  extends: ['@incubrain/foundry'],

  site: {
    name: 'AstronEra',
    url: SITE_URL,
  },

  css: [resolve('./app/assets/theme.css')],

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

  routeRules: {
    '/darksky/**': {
      appLayout: 'docs',
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

  studio: {
    route: '/admin',
    repository: {
      provider: 'github', // only GitHub is currently supported
      owner: 'incubrain', // your GitHub username or organization
      repo: 'foundry', // your repository name
      branch: 'main', // the branch to commit to (default: main)
      rootDir: resolve('./'),
      private: false,
    },
  },
});
