import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const SITE_URL = process.env.NUXT_SITE_URL || 'https://astronera.org';

export default defineNuxtConfig({
  extends: ['../../layers/base'],

  site: {
    name: 'AstronEra',
    description:
      'Dark Sky Policy & DarkSky International Certification Partner for Maharashtra',
    url: SITE_URL,
  },

  dir: {
    public: join(currentDir, 'public'),
  },

  css: [
    join(currentDir, './app/assets/css/main.css'),
    join(currentDir, './app/assets/css/starfield.css'),
  ],

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
});
