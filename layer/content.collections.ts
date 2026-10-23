import { z, property } from '@nuxt/content'
import { ICON_LIBRARIES } from './shared/constants'

export const baseConfigSchema = z.object({
  business: z.object({
    name: z.string(),
    legalName: z.string(),
    foundingYear: z.number(),
    logo: property(z.string()).editor({ input: 'media' }),
    mission: z.string(),
  }),
  socials: z.record(z.string(), z.string()).optional(),
})

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
})

export const basePageSchema = z.object({
  label: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  excerpt: z.string().optional(),
  image: property(z.string().optional()).editor({ input: 'media' }),
  navigation: z.boolean().optional(),
  layout: z.string().optional(),
  // Opt-in (product-validator-4bc): `hero: true` makes the catch-all render an
  // automatic UPageHero from `title`/`description`. It used to default to true,
  // which stacked a duplicate <h1> above every page that builds its own hero
  // (landing pages, article layouts, section-based pages).
  hero: z.boolean().optional().default(false),
  // Answer-first content (product-validator-m0f.7): a direct, quotable
  // summary an author sets once in frontmatter instead of hand-placing an
  // AnswerBlock in every article body. Optional and additive — existing
  // pages without it render exactly as before.
  answer: z.string().optional(),
  // Whole-page source citations, rendered as a visible "Sources" list by
  // layouts that support it (currently `article`). Optional and additive,
  // same rationale as `answer` above.
  sources: z
    .array(
      z.object({
        label: z.string(),
        href: z.string(),
      }),
    )
    .optional(),
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
})

// Reusable navigation link schema
const navigationLinkSchema = z.object({
  label: z.string(),
  to: z.string(),
  icon: property(z.string().optional()).editor({
    input: 'icon',
    iconLibraries: [...ICON_LIBRARIES],
  }),
  target: z.string().optional(),
})

// Navigation link with children (for footer columns)
const navigationColumnSchema = navigationLinkSchema.extend({
  children: z.array(navigationLinkSchema).optional(),
})

export const bannerSchema = z.object({
  title: z.string().optional(),
  icon: z.string().optional(),
  color: z
    .enum(['primary', 'neutral', 'success', 'warning', 'error'])
    .optional(),
  to: z.string().optional(),
  target: z.string().optional(),
  close: z.boolean().optional(),
  actions: z
    .array(
      z.object({
        label: z.string(),
        to: z.string().optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
        size: z.string().optional(),
        variant: z.string().optional(),
      }),
    )
    .optional(),
})

export const baseTeamSchema = z.object({
  slug: z.string(),
  isFounder: z.boolean().optional().default(false),
  givenName: z.string(),
  surname: z.string(),
  email: z.string().email().optional(),
  role: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.object({
    src: property(z.string()).editor({ input: 'media' }),
    alt: z.string(),
  }),
  links: z
    .array(
      z.object({
        label: z.string(),
        url: z.string().url(),
        icon: property(z.string().optional()).editor({
          input: 'icon',
          iconLibraries: [...ICON_LIBRARIES],
        }),
      }),
    )
    .optional(),
})

export const baseNavigationSchema = z.object({
  // inherit broken for nuxt/ui pending fix: https://github.com/nuxt/ui/issues/5919
  // banner: property(z.object({})).inherit('@nuxt/ui/components/Banner.vue'),
  banner: property(bannerSchema),
  header: z.object({
    title: z.string().optional(),
    socials: z.record(z.string(), z.string()).optional(),
    navigation: z.array(navigationLinkSchema).optional(),
    showSearch: z.boolean().optional().default(false),
    showColorMode: z.boolean().optional().default(false),
  }),
  footer: z.object({
    columns: z.array(navigationColumnSchema).optional(),
    bottom: z.array(navigationLinkSchema).optional(),
  }),
})
