import { createResolver } from '@nuxt/kit';
import { getActiveConfigSource } from '../../../apps/docs/shared/config-resolver';

const { resolve } = createResolver(import.meta.url);
const { resolveLayer, contentRoot, publicDir, envDir } = getActiveConfigSource(
  resolve,
  'web',
);

export default defineNuxtConfig({
  extends: [resolveLayer('docs')],

  dir: {
    public: publicDir,
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
