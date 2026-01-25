import { createResolver } from '@nuxt/kit';
import { getActiveConfigSource } from '../../../apps/docs/shared/config-resolver';

const { resolve } = createResolver(import.meta.url);
const { resolveApp } = getActiveConfigSource(resolve, 'docs');

export default defineNuxtConfig({
  extends: [resolveApp('docs')],

  site: {
    name: 'Founder Funnel Docs',
    description: 'Documentation for Founder Funnel',
  },
});
