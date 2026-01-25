import { createResolver } from '@nuxt/kit';
import { getActiveConfigSource } from '../../../apps/docs/shared/config-resolver';

const { resolve } = createResolver(import.meta.url);
const { resolveApp, contentRoot, publicDir, envDir } = getActiveConfigSource(
  resolve,
  'docs',
);

export default defineNuxtConfig({
  extends: [resolveApp('docs')],

  site: {
    name: 'Dark Sky Maharashtra',
    url: 'https://content.astronera.org',
  },

  css: [resolve('./app/assets/theme.css')],

  dir: {
    public: publicDir,
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
      rootDir: contentRoot,
      private: false,
    },
  },
});
