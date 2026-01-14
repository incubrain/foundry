import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
  extends: ['docus'],
  modules: ['@vueuse/nuxt', 'nuxt-studio'],

  site: {
    name: 'Dark Sky Maharashtra',
    url: 'https://content.astronera.org',
  },

  hooks: {
    'content:file:beforeParse'(ctx) {
      const { file } = ctx;
      // Auto-append bibliography to all docs pages (only markdown files in docs/)
      if (file.id.startsWith('docs/') && file.id.endsWith('.md')) {
        // Check if bibliography not already present
        if (!file.body.includes('::bibliography')) {
          file.body = file.body + '\n\n## References\n\n::bibliography\n::';
        }
      }
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
      rootDir: currentDir,
      private: false,
    },
  },

  compatibilityDate: '2025-07-15',
});
