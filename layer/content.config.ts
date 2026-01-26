import { defineContentConfig, defineCollection } from '@nuxt/content';
import { useNuxt } from '@nuxt/kit';
import { joinURL } from 'ufo';
import {
  basePageSchema,
  baseGlossarySchema,
  baseReferencesSchema,
  baseNavigationSchema,
  baseConfigSchema,
  baseFaqSchema,
} from './content.collections';

const { options } = useNuxt();
const cwd = joinURL(options.rootDir, 'content');

export default defineContentConfig({
  collections: {
    pages: defineCollection({
      type: 'page',
      source: [
        {
          include: 'pages/**/*.md',
          prefix: '/',
          cwd,
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
        cwd,
      },
      schema: baseReferencesSchema,
    }),

    glossary: defineCollection({
      type: 'data',
      source: {
        include: 'glossary/*.yml',
        cwd,
      },
      schema: baseGlossarySchema,
    }),

    // FAQ data
    faq: defineCollection({
      type: 'data',
      source: {
        include: 'faq/*.yml',
        cwd,
      },
      schema: baseFaqSchema,
    }),

    // Site configuration
    config: defineCollection({
      type: 'data',
      source: {
        include: 'config/site.yml',
        cwd,
      },
      schema: baseConfigSchema,
    }),

    navigation: defineCollection({
      type: 'data',
      source: {
        include: 'config/navigation.yml',
        cwd,
      },
      schema: baseNavigationSchema,
    }),
  },
});
