import { createResolver } from '@nuxt/kit';
import { getActiveConfigSource } from '../../layer/shared/config-resolver';

const { resolve } = createResolver(import.meta.url);
const { resolveLayer, contentRoot } = getActiveConfigSource(
  resolve,
  'docs',
);

export default defineNuxtConfig({
  extends: [resolveLayer()],

  site: {
    name: 'Dark Sky Maharashtra',
    url: 'https://content.astronera.org',
  },

  css: [resolve('./app/assets/theme.css')],

  llms: {
    domain: 'https://content.astronera.org',
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
        redirect: '/documents#dsi-acknowledgement',
      },
      '/doi/dsi-endorsement': { redirect: '/documents#dsi-endorsement' },
      '/doi/idspac-2023': { redirect: '/documents#idspac-2023' },
      '/doi/symposium-2025': { redirect: '/documents#symposium-2025' },
      '/doi/astrotribe-nashik-2023': {
        redirect: '/documents#astrotribe-nashik',
      },
      '/doi/astrotribe-ladakh-2024': {
        redirect: '/documents#astrotribe-ladakh',
      },
    },
  },

  studio: {
    route: '/admin',
    repository: {
      provider: 'github', // only GitHub is currently supported
      owner: 'incubrain', // your GitHub username or organization
      repo: 'founder-funnel', // your repository name
      branch: 'main', // the branch to commit to (default: main)
      rootDir: contentRoot,
      private: false,
    },
  },
});
