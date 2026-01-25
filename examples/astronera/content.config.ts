import { defineContentConfig, defineCollection } from '@nuxt/content';
import {
  basePageSchema,
  baseGlossarySchema,
  baseReferencesSchema,
  baseNavigationSchema,
  baseConfigSchema,
  baseFaqSchema,
} from '../../layer/content.collections';

export default defineContentConfig({
  collections: {
    landing: defineCollection({
      type: 'page',
      source: [
        {
          include: 'pages/**/*.md',
          prefix: '/',
        },
      ],
      schema: basePageSchema,
    }),

    docs: defineCollection({
      type: 'page',
      source: {
        include: 'docs/**/*.md',
        prefix: '/darksky',
      },
      schema: basePageSchema,
    }),

    references: defineCollection({
      type: 'data',
      source: {
        include: 'references/*.yml',
      },
      schema: baseReferencesSchema,
    }),

    glossary: defineCollection({
      type: 'data',
      source: {
        include: 'glossary/*.yml',
      },
      schema: baseGlossarySchema,
    }),

    // FAQ data
    faq: defineCollection({
      type: 'data',
      source: {
        include: 'faq/*.yml',
      },
      schema: baseFaqSchema,
    }),

    // Site configuration
    config: defineCollection({
      type: 'data',
      source: {
        include: 'config/site.yml',
      },
      schema: baseConfigSchema,
    }),

    navigation: defineCollection({
      type: 'data',
      source: {
        include: 'config/navigation.yml',
      },
      schema: baseNavigationSchema,
    }),
  },
});
