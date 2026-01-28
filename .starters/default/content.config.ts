import { defineContentConfig, defineCollection } from '@nuxt/content';
import {
  baseConfigSchema,
  baseFaqSchema,
  baseNavigationSchema,
  basePageSchema,
} from '@incubrain/founder-funnel/content.collections';

export default defineContentConfig({
  collections: {
    pages: defineCollection({
      type: 'page',
      source: {
        include: 'pages/**/*.md',
        prefix: '/',
      },
      schema: basePageSchema,
    }),
    config: defineCollection({
      type: 'data',
      source: {
        include: 'config/site.yml',
      },
      schema: baseConfigSchema,
    }),
    faq: defineCollection({
      type: 'data',
      source: {
        include: 'faq/*.yml',
      },
      schema: baseFaqSchema,
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
