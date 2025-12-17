// content.config.ts
import { defineCollection, defineContentConfig, z, property } from '@nuxt/content';
import { asSeoCollection } from '@nuxtjs/seo/content';
import { getActiveConfigSource } from './shared/utils/config-resolver';
import { ICON_LIBRARIES } from './shared/config/icons';
import path from 'node:path';

const FAQ_COLORS = z.enum(['error', 'warning', 'success', 'info']);


// Determine the root directory for content based on the active source
// Custom: Uses project root (which contains a 'content' dir)
const appConfig = getActiveConfigSource();

export default defineContentConfig({
  collections: {
    pages: defineCollection(asSeoCollection({
      type: 'page',
      source: {
        cwd: appConfig.contentDir,
        include: 'pages/**/*.md',
        prefix: '/'
      },
      schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        excerpt: z.string().optional(),
        image: property(z.string().optional()).editor({ input: 'media' }),
        // Decision-specific fields (all optional for backward compatibility)
        label: z.enum(['pivot', 'persist', 'kill', 'experiment', 'signal', 'strategy', 'learning', 'feature']).optional(),
        date: z.string().optional(),
      }),
    })),

    config: defineCollection({
      type: 'data',
      source: {
        cwd: appConfig.contentDir,
        include: 'config/*.yml',
      },
      schema: z.object({
        business: z.object({
          name: z.string(),
          legal_name: z.string(),
          founding_year: z.number(),
          logo: property(z.string()).editor({ input: 'media' }),
          mission: z.string(),
        }),
        founder: z.object({
          given_name: z.string(),
          surname: z.string(),
          email: z.string().email(),
          role: z.string(),
          avatar: z.object({
            src: property(z.string()).editor({ input: 'media' }),
            alt: z.string(),
          }),
          bio: z.string(),
          links: z.array(z.object({
            label: z.string(),
            url: z.string(),
            icon: property(z.string()).editor({ input: 'icon', iconLibraries: ICON_LIBRARIES }),
          })).optional(),
        }),
      }),
    }),

    faq: defineCollection({
      type: 'data',
      source: {
        cwd: appConfig.contentDir,
        include: 'faq/*.yml',
      },
      schema: z.object({
        type: z.enum(['warning', 'objection', 'support', 'general', 'values']),
        label: z.string(),
        icon: property(z.string()).editor({ input: 'icon', iconLibraries: ICON_LIBRARIES }),
        color: FAQ_COLORS,
        items: z.array(z.object({
          label: z.string(),
          content: z.string(),
        })),
      }),
    }),
  },
});
