// Collection config can be a string (name only) or object with routing info
type CollectionConfig =
  | string
  | {
      name: string;
      prefix?: string;
      backLabel?: string;
    };

// Helper to extract collection name from config
export function getCollectionName(config: CollectionConfig): string;
// Helper to extract collection prefix from config
export function getCollectionPrefix(config: CollectionConfig): string;
// Helper to extract collection backLabel from config
export function getCollectionBackLabel(config: CollectionConfig): string | undefined;

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
