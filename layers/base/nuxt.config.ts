import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ICON_LIBRARIES } from '../../shared/constants';

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
  $meta: {
    name: 'base', // ← Creates #layers/base alias
    // https://nuxt.com/docs/4.x/guide/going-further/layers#named-layer-aliases
  },

  modules: [
    '@nuxtjs/seo',
    '@nuxt/ui',
    '@nuxt/content', // <-- Must be after @nuxtjs/seo & @nuxt/ui
    'nuxt-llms', // <-- Add AFTER @nuxt/content
    '@nuxt/fonts',
    '@nuxt/image',
    '@vueuse/nuxt',
    '@nuxt/scripts',
    'nuxt-studio',
  ],

  seo: {
    redirectToCanonicalSiteUrl: true,
  },

  hooks: {
    'components:extend': (components) => {
      // {DX}: Adds these components to the global scope, making them available in Nuxt Studio via '/' command palette
      const globals = components.filter((c) =>
        ['UButton', 'UIcon'].includes(c.pascalName),
      );

      globals.forEach((c) => (c.global = true));
    },
  },

  app: {
    pageTransition: {
      name: 'page',
      mode: 'out-in',
    },
    layoutTransition: {
      name: 'layout',
      mode: 'out-in',
    },
  },

  alias: {
    '#constants': fileURLToPath(
      new URL('../../shared/constants.ts', import.meta.url),
    ),
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

  future: {
    compatibilityVersion: 4,
  },

  router: {
    options: {
      scrollBehaviorType: 'smooth',
    },
  },

  experimental: {
    defaults: {
      nuxtLink: {
        externalRelAttribute: 'noopener noreferrer',
        prefetch: false,
        prefetchOn: { interaction: true },
        trailingSlash: 'remove',
      },
    },
  },

  ssr: true,
  compatibilityDate: '2025-07-15',

  css: [join(currentDir, './app/assets/css/main.css')],
  dir: {
    assets: join(currentDir, './app/assets'),
  },

  icon: {
    serverBundle: {
      // {DX}: Using full @iconify/json no need to install collection packages
      // collections array enables tree-shake
      collections: [...ICON_LIBRARIES],
    },
  },
});
