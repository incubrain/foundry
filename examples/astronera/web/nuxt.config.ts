import { createResolver } from '@nuxt/kit';
import { getActiveConfigSource } from '../../../apps/docs/shared/config-resolver';

const { resolve } = createResolver(import.meta.url);
const { resolveApp, contentRoot, publicDir, envDir } = getActiveConfigSource(
  resolve,
  'web',
);

const SITE_URL = process.env.NUXT_SITE_URL || 'https://astronera.org';

export default defineNuxtConfig({
  extends: [resolveApp('docs')],

  site: {
    name: 'AstronEra',
    description:
      'Dark Sky Policy & DarkSky International Certification Partner for Maharashtra',
    url: SITE_URL,
  },

  dir: {
    public: publicDir,
  },

  alias: {
    public: publicDir,
  },

  vite: {
    envDir: envDir,
  },

  compatibilityDate: '2026-01-20',

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
