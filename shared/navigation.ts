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

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const useNavigation = () => {
  return useAsyncData('navigation', async () => {
    // Query offers from content
    const offers = await queryCollection('pages')
      .where('path', 'LIKE', '/offers/%')
      .where('path', 'NOT LIKE', '%/success%')
      .select('path', 'title')
      .all();

    const offerLinks = offers.map((offer) => ({
      label: slugToTitle(offer.path.split('/').pop()!),
      to: offer.path,
    }));

    const primaryOffer = offers[0]?.path.split('/').pop() || 'mentorship';

    const navigation: NavigationConfig = {
      layout: {
        banner: { sticky: true, offer: primaryOffer },
        navbar: { sticky: false },
        footer: { offer: primaryOffer },
      },
      main: [
        {
          label: 'About',
          to: '/about',
        },
        ...offerLinks,
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
          children: offerLinks,
        },
      ],
    };

    return navigation;
  });
};
