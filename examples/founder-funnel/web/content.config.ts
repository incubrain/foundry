// templates/founder-funnel/content.config.ts
import { defineContentConfig, z, defineCollection } from '@nuxt/content';
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
// EXTEND BASE SCHEMA
// ==========================================

const extendedPagesSchema = basePageSchema.merge(
  z.object({
    testMergeField: z.string().optional(),
  }),
);

// ==========================================
// SINGLE CONTENT CONFIG
// ==========================================

export default defineContentConfig({
  collections: {
    landing: defineCollection({
      type: 'page',
      source: {
        cwd,
        include: 'pages/**/*.md',
        prefix: '/',
      },
      schema: extendedPagesSchema,
    }),
    faq: defineCollection({
      type: 'data',
      source: {
        cwd,
        include: 'faq/*.yml',
      },
      schema: baseFaqSchema,
    }),
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
