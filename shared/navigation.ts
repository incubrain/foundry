// shared/navigation.ts
import type { NavigationMenuItem } from '@nuxt/ui';

export type SectionId = 'benefits' | 'outcome' | 'offer' | 'results' | 'faq';
export interface NavigationConfig {
  layout: {
    banner: { sticky: boolean; offer: string };
    navbar: { sticky: boolean };
    footer: { offer: string };
  };
  main: NavigationMenuItem[];
  footerLinks: {
    label: string;
    children: {
      label: string;
      to: string;
    }[];
  }[];
}

export const useNavigation = () => {
  return useAsyncData('navigation', async () => {
    try {
      const navConfig = await queryCollection('navigation').first();

      if (navConfig) {
        return navConfig as NavigationConfig;
      }
    } catch (error) {
      console.warn('[navigation] No navigation config found, using defaults');
    }

    // Fallback defaults if no navigation.yml exists
    const defaultNavigation: NavigationConfig = {
      layout: {
        banner: { sticky: true, offer: '' },
        navbar: { sticky: false },
        footer: { offer: '' },
      },
      main: [],
      footerLinks: [],
    };

    return defaultNavigation;
  });
};
