import type { DefinedCollection } from '@nuxt/content';
import { defineContentConfig, defineCollection, z } from '@nuxt/content';
import { useNuxt } from '@nuxt/kit';
import { joinURL } from 'ufo';

const { options } = useNuxt();
const cwd = joinURL(options.rootDir, 'content');
const locales = options.i18n?.locales;

const pageSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
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

let collections: Record<string, DefinedCollection>;

if (locales && Array.isArray(locales)) {
  collections = {};

  for (const locale of locales) {
    const code = (typeof locale === 'string' ? locale : locale.code).replace(
      '-',
      '_',
    );

    collections[`landing_${code}`] = defineCollection({
      type: 'page',
      source: [
        {
          cwd,
          include: `${code}/index.md`,
        },
        {
          cwd,
          include: `${code}/sources.md`,
        },
      ],
      schema: pageSchema,
    });

    collections[`docs_${code}`] = defineCollection({
      type: 'page',
      source: { cwd, include: `${code}/docs/**/*.md`, prefix: `/${code}` },
      schema: pageSchema,
    });

    collections[`references_${code}`] = defineCollection({
      type: 'data',
      source: { cwd, include: `${code}/references/*.yml`, prefix: `/${code}` },
      schema: referencesSchema,
    });
  }
} else {
  collections = {
    landing: defineCollection({
      type: 'page',
      source: [
        {
          cwd,
          include: 'index.md',
        },
        {
          cwd,
          include: 'sources.md',
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
  };
}

export default defineContentConfig({ collections });
