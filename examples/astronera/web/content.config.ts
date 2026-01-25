// examples/astronera/web/content.config.ts
import { defineContentConfig, defineCollection } from '@nuxt/content';
import { createResolver } from '@nuxt/kit';
import {
  baseConfigSchema,
  baseFaqSchema,
  baseNavigationSchema,
  basePageSchema,
} from '../../../apps/docs/content.collections';
import { getActiveConfigSource } from '../../../apps/docs/shared/config-resolver';

const { resolve } = createResolver(import.meta.url);
const { contentDir: cwd } = getActiveConfigSource(resolve, 'web');

// ==========================================
// ASTRONERA WEB CONTENT CONFIG (Docus-compatible)
// ==========================================

export default defineContentConfig({
  collections: {
    landing: defineCollection({
      type: 'page',
      source: [
        {
          cwd,
          include: 'pages/**/*.md',
          prefix: '/',
        },
      ],
      schema: basePageSchema,
    }),

    

    // FAQ data
    faq: defineCollection({
      type: 'data',
      source: {
        cwd,
        include: 'faq/*.yml',
      },
      schema: baseFaqSchema,
    }),

    // Site configuration
    config: defineCollection({
      type: 'data',
      source: {
        cwd,
        include: 'config/site.yml',
      },
      schema: baseConfigSchema,
    }),

    // Navigation
    navigation: defineCollection({
      type: 'data',
      source: {
        cwd,
        include: 'config/navigation.yml',
      },
      schema: baseNavigationSchema,
    }),
  },
});
