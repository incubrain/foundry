import { createResolver } from '@nuxt/kit';
import { getActiveConfigSource } from '../../../layer/shared/config-resolver';

const { resolve } = createResolver(import.meta.url);
const { contentRoot, publicDir } = getActiveConfigSource(resolve, 'web');

export default defineNuxtConfig({
  extends: ['@incubrain/foundry'],

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
      repo: 'foundry', // your repository name
      branch: 'main', // the branch to commit to (default: main)
      rootDir: contentRoot,
      private: false,
    },
  },
});
