import { defineContentConfig, defineCollection } from '@nuxt/content'

import {
  baseBlogSchema,
  baseConfigSchema,
  baseFaqSchema,
  basePageSchema,
  baseNavigationSchema,
} from '@incubrain/foundry/schemas'

export default defineContentConfig({
  collections: {
    // Pages collection
    pages: defineCollection({
      type: 'page',
      source: {
        include: 'pages/**/*.md',
        prefix: '/',
      },
      schema: basePageSchema,
    }),

    // Blog — posts go live at their `publishAt` (foundry.blog in nuxt.config.ts)
    blog: defineCollection({
      type: 'page',
      source: {
        include: 'blog/**/*.md',
        prefix: '/blog',
      },
      schema: baseBlogSchema,
    }),

    // FAQ data
    faq: defineCollection({
      type: 'data',
      source: {
        include: 'faq/*.yml',
      },
      schema: baseFaqSchema,
    }),

    // Site config
    config: defineCollection({
      type: 'data',
      source: {
        include: 'config/site.yml',
      },
      schema: baseConfigSchema,
    }),

    // Navigation
    navigation: defineCollection({
      type: 'data',
      source: {
        include: 'config/navigation.yml',
      },
      schema: baseNavigationSchema,
    }),
  },
})
