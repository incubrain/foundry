// shared/config/navigation.ts
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

export const NAVIGATION: NavigationConfig = {
  layout: {
    banner: { sticky: true, offer: 'mentorship' },
    navbar: { sticky: false },
    footer: { offer: 'mentorship' },
  },
  main: [
    {
      label: 'About',
      to: '/about',
    },
    {
      label: 'Mentorship',
      to: '/offers/mentorship',
    },
  ],
  footerLinks: [
    {
      label: 'About',
      children: [
        { label: 'Our Story', to: '/about' },
        { label: 'Decisions', to: '/decisions' },
        {
          label: 'Roadmap',
          to: 'https://github.com/incubrain/founder-funnel/discussions/133',
        },
      ],
    },
    {
      label: 'Offers',
      children: [{ label: 'Mentorship', to: '/offers/mentorship' }],
    },
  ],
} as const;

export default NAVIGATION;
