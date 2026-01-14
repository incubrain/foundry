import { useNuxt } from '@nuxt/kit';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const currentDir = dirname(fileURLToPath(import.meta.url));

console.log('currentDir', currentDir);

export default defineNuxtConfig({
  extends: ['docus'],
  modules: ['@vueuse/nuxt', 'nuxt-studio', '@nuxtjs/i18n'],

  experimental: {
    asyncContext: true,
  },

  site: {
    name: 'Dark Sky Maharashtra',
    url: 'https://content.astronera.org',
  },

  i18n: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English' },
      { code: 'mr', name: 'मराठी' },
    ],
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

  hooks: {
    'nitro:config'(nitroConfig) {
      const nuxt = useNuxt();

      const i18nOptions = nuxt.options.i18n;

      const routes: string[] = [];
      if (!i18nOptions) {
        routes.push('/');
      } else {
        routes.push(
          ...(i18nOptions.locales?.map((locale) =>
            typeof locale === 'string' ? `/${locale}` : `/${locale.code}`,
          ) || []),
        );
      }

      nitroConfig.prerender = nitroConfig.prerender || {};
      nitroConfig.prerender.routes = nitroConfig.prerender.routes || [];
      nitroConfig.prerender.routes.push(...(routes || []));
    },
  },

  compatibilityDate: '2025-07-15',
});
