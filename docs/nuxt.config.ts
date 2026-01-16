import { useNuxt } from '@nuxt/kit';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const currentDir = dirname(fileURLToPath(import.meta.url));

console.log('currentDir', currentDir);

export default defineNuxtConfig({
  extends: ['docus'],
  modules: ['@vueuse/nuxt', 'nuxt-studio'],

  experimental: {
    asyncContext: true,
  },

  site: {
    name: 'Dark Sky Maharashtra',
    url: 'https://content.astronera.org',
  },

  content: {
    build: {
      markdown: {
        remarkPlugins: {
          'remark-math': {}, // Parse LaTeX syntax
        },
        rehypePlugins: {
          'rehype-katex': {}, // Render with KaTeX (swap to 'rehype-mathjax' if preferred)
        },
      },
    },
  },

  llms: {
    domain: 'https://content.astronera.org',
    title: 'Dark Sky Conservation in Maharashtra',
    description: 'Dark Sky Conservation in Maharashtra',
    notes: [
      'The documentation only includes Dark Sky Conservation in Maharashtra docs.',
      'The content is automatically generated from the same source as the official documentation.',
    ],
    full: {
      title: 'Complete Documentation',
      description: 'The complete documentation including all content',
    },
  },

  studio: {
    route: '/admin',
    repository: {
      provider: 'github', // only GitHub is currently supported
      owner: 'incubrain', // your GitHub username or organization
      repo: 'founder-funnel', // your repository name
      branch: 'main', // the branch to commit to (default: main)
      rootDir: 'docs',
      private: false,
    },
  },

  compatibilityDate: '2025-07-15',
});
