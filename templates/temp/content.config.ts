// templates/founder-funnel/content.config.ts
import { defineContentConfig, z } from '@nuxt/content';
import {
  createPagesCollection,
  createConfigCollection,
  createFaqCollection,
  basePagesSchema,
} from '../../layers/base/content.collections';

// ==========================================
// EXTEND BASE SCHEMA
// ==========================================

const extendedPagesSchema = basePagesSchema.merge(
  z.object({
    testMergeField: z.string().optional(),
  }),
);

// ==========================================
// SINGLE CONTENT CONFIG
// ==========================================

export default defineContentConfig({
  collections: {
    pages: createPagesCollection({
      schema: extendedPagesSchema,
    }),
    config: createConfigCollection(),
    faq: createFaqCollection(),
  },
});
