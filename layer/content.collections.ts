import { z, property } from '@nuxt/content';
import { ICON_LIBRARIES } from './shared/constants';

export const baseConfigSchema = z.object({
  business: z.object({
    name: z.string(),
    legalName: z.string(),
    foundingYear: z.number(),
    logo: property(z.string()).editor({ input: 'media' }),
    mission: z.string(),
  }),
  socials: z.record(z.string(), z.string()).optional(),
});

export const baseFaqSchema = z.object({
  type: z.string(),
  label: z.string(),
  icon: property(z.string()).editor({
    input: 'icon',
    iconLibraries: [...ICON_LIBRARIES],
  }),
  color: z.enum(['error', 'warning', 'success', 'info']),
  items: z.array(
    z.object({
      label: z.string(),
      content: z.string(),
    }),
  ),
});

export const basePageSchema = z.object({
  label: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  excerpt: z.string().optional(),
  image: property(z.string().optional()).editor({ input: 'media' }),
  navigation: z.boolean().optional(),
  layout: z.string().optional(),
  links: z
    .array(
      z.object({
        label: z.string(),
        icon: property(z.string().optional()).editor({
          input: 'icon',
          iconLibraries: [...ICON_LIBRARIES],
        }),
        to: z.string(),
        target: z.string().optional(),
      }),
    )
    .optional(),
});

export const baseReferencesSchema = z.object({
  category: z.object({
    id: z.string(),
    label: z.string(),
  }),
  sources: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      author: z.string().optional(),
      date: z.string(),
      description: z.string().optional(),
      credibilityScore: z.number().min(1).max(10).optional(),
      affiliation: z.string().optional(),
      pdf: z.string().optional(),
      url: z.string().optional(),
    }),
  ),
});

export const baseGlossarySchema = z.object({
  category: z.object({
    id: z.string(), // replace with slug
    label: z.string(),
    color: z.string().optional(),
  }),
  terms: z.array(
    z.object({
      id: z.string(), // replace with slug
      term: z.string(),
      abbreviation: z.string().optional(),
      definition: z.string(),
    }),
  ),
});

// Reusable navigation link schema
const navigationLinkSchema = z.object({
  label: z.string(),
  to: z.string(),
  icon: property(z.string().optional()).editor({
    input: 'icon',
    iconLibraries: [...ICON_LIBRARIES],
  }),
  target: z.string().optional(),
});

// Navigation link with children (for footer columns)
const navigationColumnSchema = navigationLinkSchema.extend({
  children: z.array(navigationLinkSchema).optional(),
});

export const baseNavigationSchema = z.object({
  banner: property(z.object({})).inherit('@nuxt/ui/components/Banner.vue'),
  header: z.object({
    title: z.string().optional(),
    socials: z.record(z.string(), z.string()).optional(),
    navigation: z.array(navigationLinkSchema).optional(),
    showSearch: z.boolean().optional().default(true),
    showColorMode: z.boolean().optional().default(true),
  }),
  footer: z.object({
    columns: z.array(navigationColumnSchema).optional(),
    bottom: z.array(navigationLinkSchema).optional(),
  }),
});
