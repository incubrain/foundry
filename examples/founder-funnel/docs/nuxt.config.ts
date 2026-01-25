import { createResolver } from '@nuxt/kit';
import { getActiveConfigSource } from '../../../apps/docs/shared/config-resolver';

const { resolve } = createResolver(import.meta.url);
const { resolveLayer } = getActiveConfigSource(resolve, 'docs');

export default defineNuxtConfig({
  extends: [resolveLayer('docs')],

  site: {
    name: 'Founder Funnel Docs',
    description: 'Documentation for Founder Funnel',
  },
});
