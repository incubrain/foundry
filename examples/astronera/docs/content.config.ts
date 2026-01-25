import { defineContentConfig, defineCollection } from '@nuxt/content';
import { createResolver } from '@nuxt/kit';
import {
  basePageSchema,
  baseGlossarySchema,
  baseReferencesSchema,
  baseNavigationSchema,
  baseConfigSchema,
} from '../../../apps/docs/content.collections';
import { getActiveConfigSource } from '../../../apps/docs/shared/config-resolver';

const { resolve } = createResolver(import.meta.url);
const { contentDir: cwd } = getActiveConfigSource(resolve, 'docs');

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

    docs: defineCollection({
      type: 'page',
      source: {
        cwd,
        include: 'docs/**/*.md',
        prefix: '/',
      },
      schema: basePageSchema,
    }),

    references: defineCollection({
      type: 'data',
      source: {
        cwd,
        include: 'references/*.yml',
      },
      schema: baseReferencesSchema,
    }),

    glossary: defineCollection({
      type: 'data',
      source: {
        cwd,
        include: 'glossary/*.yml',
      },
      schema: baseGlossarySchema,
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
