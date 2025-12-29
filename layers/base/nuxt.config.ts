import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
  modules: [
    '@nuxtjs/seo',
    '@nuxt/ui',
    '@nuxt/content', // <-- Must be after @nuxtjs/seo & @nuxt/ui
    'nuxt-llms', // <-- Add AFTER @nuxt/content
    '@nuxt/fonts',
    '@nuxt/image',
    '@vueuse/nuxt',
    '@nuxt/scripts',
    'nuxt-studio', // {DX}: studio breaks HMR beta.1
  ],
  css: [join(currentDir, './app/assets/css/main.css')],
  dir: {
    assets: join(currentDir, './app/assets'),
  },
});
