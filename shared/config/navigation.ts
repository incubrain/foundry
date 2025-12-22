// shared/config/navigation.ts
import type { NavigationMenuItem } from '@nuxt/ui';

export type SectionAnchor =
  | '#benefits'
  | '#outcome'
  | '#offer'
  | '#results'
  | '#faq';

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
    footer: { offer: 'join-us' },
  },
  main: [
    {
      label: 'Our Story',
      to: '/founder',
    },
    {
      label: 'Offers',
      children: [
        {
          label: 'Mentorship',
          to: '/offers/mentorship',
          icon: 'i-lucide-group',
        },
        { label: 'Join Us', to: '/offers/join-us', icon: 'i-lucide-user' },
      ],
    },
  ],
  footerLinks: [
    {
      label: 'About',
      children: [
        { label: 'Founder', to: '/founder' },
        { label: 'Decisions', to: '/decisions' },
        {
          label: 'Roadmap',
          to: 'https://github.com/incubrain/founder-funnel/discussions/133',
        },
      ],
    },
    {
      label: 'Offers',
      children: [
        { label: 'Mentorship', to: '/offers/mentorship' },
        { label: 'Join Us', to: '/offers/join-us' },
      ],
    },
  ],
} as const;

export default NAVIGATION;
