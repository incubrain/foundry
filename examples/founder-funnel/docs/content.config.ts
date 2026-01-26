import { defineContentConfig, defineCollection } from '@nuxt/content';
import { createResolver } from '@nuxt/kit';
import {
  basePageSchema,
  baseNavigationSchema,
} from '../../../layer/content.collections';
import { getActiveConfigSource } from '../../../layer/shared/config-resolver';

const { resolve } = createResolver(import.meta.url);
const { contentDir: cwd } = getActiveConfigSource(resolve, 'docs');

export default defineContentConfig({
  collections: {
    docs: defineCollection({
      type: 'page',
      source: {
        cwd,
        include: 'docs/**/*.md',
        prefix: '/',
      },
      schema: basePageSchema,
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
