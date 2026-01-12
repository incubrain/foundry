import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
  extends: ['../../layers/base'],

  // {DX}: studio breaks HMR beta.3
  studio: {
    // Studio admin route (default: '/_studio')
    route: '/_studio',

    // {FIX}: broken, pending triage of this https://github.com/nuxt-content/studio/pull/73
    // development: {
    //   sync: true, // Enable development mode
    // },

    // GitHub repository configuration (owner and repo are required)
    repository: {
      provider: 'github', // only GitHub is currently supported
      owner: 'incubrain', // your GitHub username or organization
      repo: 'founder-funnel', // your repository name
      branch: 'main', // the branch to commit to (default: main)
      private: false,
    },
  },
});
