// templates/astronera/content.config.ts
import { defineContentConfig } from '@nuxt/content';
import {
  createPagesCollection,
  createConfigCollection,
  createFaqCollection,
  createNavigationCollection,
} from '../../layers/base/content.collections';

// ==========================================
// ASTRONERA CONTENT CONFIG
// ==========================================

export default defineContentConfig({
  collections: {
    pages: createPagesCollection(),
    config: createConfigCollection(),
    faq: createFaqCollection(),
    navigation: createNavigationCollection(),
  },
});
