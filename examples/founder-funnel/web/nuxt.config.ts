import { createResolver } from '@nuxt/kit';
import { getActiveConfigSource } from '../../../layer/shared/config-resolver';

const { resolve } = createResolver(import.meta.url);
const { contentRoot, publicDir } = getActiveConfigSource(
  resolve,
  'web',
);
const SITE_URL = process.env.NUXT_SITE_URL;

export default defineNuxtConfig({
  extends: ['@incubrain/founder-funnel'],

  site: {
    name: 'Founder Funnel',
    description: 'Open-source funnel for technical founders',
  },

  dir: {
    public: publicDir,
  },

  llms: {
    domain: SITE_URL,
    title: 'Founder Funnel',
    description:
      'Open-source landing page template for technical founders validating product ideas',

    sections: [
      // High Priority: Revenue Pages (Offers)
      {
        title: 'Product Offers',
        description:
          'Ways to work with us - mentorship, templates, and opportunities',
        contentCollection: 'pages',
        contentFilters: [
          { field: 'path', operator: 'LIKE', value: '/offers/%' },
          { field: 'path', operator: 'NOT LIKE', value: '%-success' }, // Exclude success pages
        ],
      },

      // Medium Priority: About/Story
      {
        title: 'About',
        description: 'Our story and mission',
        contentCollection: 'pages',
        contentFilters: [{ field: 'path', operator: '=', value: '/about' }],
      },

      // Medium Priority: Decisions
      {
        title: 'Decisions',
        description: 'Founders strategic decisions',
        contentCollection: 'pages',
        contentFilters: [
          { field: 'path', operator: 'LIKE', value: '/decisions/%' },
          { field: 'label', operator: 'IS NOT NULL' }, // Only labeled decisions
        ],
      },

      // Low Priority: Home Page
      {
        title: 'Overview',
        description: 'Product overview and value proposition',
        contentCollection: 'pages',
        contentFilters: [{ field: 'path', operator: '=', value: '/' }],
      },
    ],

    notes: [
      'This is an open-source project (MIT License)',
      'Template designed for technical founders validating ideas',
      'Built with Nuxt 4, Tailwind v4, TypeScript',
    ],
  },

  studio: {
    // Studio admin route (default: '/_studio')
    route: '/_studio',

    // GitHub repository configuration (owner and repo are required)
    repository: {
      provider: 'github', // only GitHub is currently supported
      owner: 'incubrain', // your GitHub username or organization
      repo: 'founder-funnel', // your repository name
      branch: 'main', // the branch to commit to (default: main)
      rootDir: contentRoot,
      private: false,
    },
  },
});
