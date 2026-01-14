import { defineCollection, defineContentConfig, z } from '@nuxt/content';

export default defineContentConfig({
  // Register transformer

  collections: {
    docs: defineCollection({
      type: 'page',
      source: { include: 'docs/**/*.md' },
      schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        navigation: z.boolean().optional(),
        layout: z.string().optional(),
      }),
    }),
    landing: defineCollection({
      type: 'page',
      source: [
        {
          include: 'index.md',
        },
        {
          include: 'sources.md',
        },
      ],
      schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        navigation: z.boolean().optional(),
        layout: z.string().optional(),
      }),
    }),
    references: defineCollection({
      type: 'data',
      source: {
        include: 'references/*.yml',
        prefix: '/',
      },
      schema: z.object({
        category: z.string(),
        sources: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            author: z.string(),
            url: z.string().optional(),
            pdf: z.string().optional(),
            credibility: z
              .enum(['government', 'academic', 'educational', 'media', 'ngo'])
              .optional(),
            date: z.string().optional(),
            description: z.string().optional(),
            topics: z.array(z.string()).optional(),
          }),
        ),
      }),
    }),
  },
});
