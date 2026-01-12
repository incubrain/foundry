// layers/base/content.collections.ts
import { defineCollection, z, property } from '@nuxt/content';
import { asSeoCollection } from '@nuxtjs/seo/content';
import { getActiveConfigSource } from '../../shared/utils/config-resolver';
import { ICON_LIBRARIES } from '../../shared/constants';

const { contentDir } = getActiveConfigSource();

// ==========================================
// BASE SCHEMAS
// ==========================================

export const basePagesSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  excerpt: z.string().optional(),
  image: property(z.string().optional()).editor({ input: 'media' }),
});

export const baseConfigSchema = z.object({
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
    links: z
      .array(
        z.object({
          label: z.string(),
          url: z.string(),
          icon: property(z.string()).editor({
            input: 'icon',
            iconLibraries: [...ICON_LIBRARIES],
          }),
        }),
      )
      .optional(),
  }),
});

export const baseFaqSchema = z.object({
  type: z.enum([
    'warning',
    'objection',
    'support',
    'general',
    'values',
    'mentorship',
    'policy',
    'certification',
    'technical',
  ]),
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

export const baseNavigationSchema = z.object({
  layout: z.object({
    banner: z.object({
      sticky: z.boolean(),
      offer: z.string(),
    }),
    navbar: z.object({
      sticky: z.boolean(),
    }),
    footer: z.object({
      offer: z.string(),
    }),
  }),
  main: z.array(
    z.object({
      label: z.string(),
      to: z.string(),
    }),
  ),
  footerLinks: z.array(
    z.object({
      label: z.string(),
      children: z.array(
        z.object({
          label: z.string(),
          to: z.string(),
        }),
      ),
    }),
  ),
});

// ==========================================
// COLLECTION FACTORIES
// ==========================================

export function createPagesCollection({
  schema = basePagesSchema,
}: {
  schema?: typeof basePagesSchema;
} = {}) {
  return defineCollection(
    asSeoCollection({
      type: 'page',
      source: {
        cwd: contentDir,
        include: 'pages/**/*.md',
        prefix: '/',
      },
      schema,
    }),
  );
}

export function createConfigCollection({
  schema = baseConfigSchema,
}: {
  schema?: typeof baseConfigSchema;
} = {}) {
  return defineCollection({
    type: 'data',
    source: {
      cwd: contentDir,
      include: 'config/site.yml',
    },
    schema,
  });
}

export function createFaqCollection({
  schema = baseFaqSchema,
}: {
  schema?: typeof baseFaqSchema;
} = {}) {
  return defineCollection({
    type: 'data',
    source: {
      cwd: contentDir,
      include: 'faq/*.yml',
    },
    schema,
  });
}

export function createNavigationCollection({
  schema = baseNavigationSchema,
}: {
  schema?: typeof baseNavigationSchema;
} = {}) {
  return defineCollection({
    type: 'data',
    source: {
      cwd: contentDir,
      include: 'config/navigation.yml',
    },
    schema,
  });
}
