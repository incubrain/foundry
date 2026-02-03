import type { Collections } from '@nuxt/content';

/**
 * Collection type - matches Nuxt Content's collection types
 * - 'page': Markdown files with routes (routable)
 * - 'data': YAML/JSON data files (not routable)
 */
type CollectionType = 'page' | 'data';

/**
 * Collection config can be a string (collection name) or object with routing info
 */
type CollectionConfig =
  | keyof Collections
  | {
      name: keyof Collections;
      type?: CollectionType;
      prefix?: string;
      backLabel?: string;
    };

declare module 'nuxt/schema' {
  interface AppConfig {
    content: {
      collections: {
        docs: CollectionConfig;
        pages: CollectionConfig;
        glossary: CollectionConfig;
        references: CollectionConfig;
        faq: CollectionConfig;
        config: CollectionConfig;
        navigation: CollectionConfig;
        searchable: string[];
      };
      routing: {
        sources: string;
        offers: string;
        success: string;
      };
    };
    seo: {
      titleTemplate: string;
      title: string;
      description: string;
    };
    logo: {
      light: string;
      dark: string;
      alt: string;
    };
    header: {
      title: string;
    };
    socials: Record<string, string>;
    toc: {
      title: string;
      bottom: {
        title: string;
        links: {
          icon: string;
          label: string;
          to: string;
          target: string;
        }[];
      };
    };
    github:
      | {
          owner: string;
          name: string;
          url: string;
          branch: string;
          rootDir?: string;
        }
      | false;
  }
}

export {};
