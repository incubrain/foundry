import { defineContentConfig, defineCollection, z } from '@nuxt/content';
import { useNuxt } from '@nuxt/kit';
import { joinURL } from 'ufo';

const { options } = useNuxt();
const cwd = joinURL(options.rootDir, 'content');

const pageSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  label: z.string().optional(),
  navigation: z.boolean().optional(),
  layout: z.string().optional(),
  links: z
    .array(
      z.object({
        label: z.string(),
        icon: z.string(),
        to: z.string(),
        target: z.string().optional(),
      }),
    )
    .optional(),
});

const referencesSchema = z.object({
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
});

const glossarySchema = z.object({
  terms: z.array(
    z.object({
      term: z.string(),
      abbreviation: z.string().optional(),
      definition: z.string(),
      category: z
        .enum(['technical', 'regulatory', 'ecological', 'general'])
        .optional(),
    }),
  ),
});

export default defineContentConfig({
  collections: {
    landing: defineCollection({
      type: 'page',
      source: [
        {
          cwd,
          include: 'index.md',
        },
        {
          cwd,
          include: 'resources/*.md',
        },
      ],
      schema: pageSchema,
    }),

    docs: defineCollection({
      type: 'page',
      source: { cwd, include: 'docs/**/*.md', prefix: '/' },
      schema: pageSchema,
    }),

    references: defineCollection({
      type: 'data',
      source: { cwd, include: 'references/*.yml', prefix: '/' },
      schema: referencesSchema,
    }),

    glossary: defineCollection({
      type: 'data',
      source: { cwd, include: 'glossary/*.yml', prefix: '/' },
      schema: glossarySchema,
    }),
  },
});
