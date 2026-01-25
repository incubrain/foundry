import { defineNuxtModule } from '@nuxt/kit';
import { defu } from 'defu';
import { inferSiteURL, getPackageJsonMetadata } from '../shared/utils/meta';

export default defineNuxtModule({
  meta: {
    name: 'config',
  },
  async setup(_options, nuxt) {
    const dir = nuxt.options.rootDir;
    const url = inferSiteURL();
    const meta = await getPackageJsonMetadata(dir);
    const siteName = nuxt.options?.site?.name || meta.name || '';

    nuxt.options.llms = defu(nuxt.options.llms, {
      domain: url,
      title: siteName,
      description: meta.description || '',
      full: {
        title: siteName,
        description: meta.description || '',
      },
    });

    nuxt.options.site = defu(nuxt.options.site, {
      url,
      name: siteName,
      debug: false,
    });

    nuxt.options.appConfig.header = defu(nuxt.options.appConfig.header, {
      title: siteName,
    });

    nuxt.options.appConfig.seo = defu(nuxt.options.appConfig.seo, {
      titleTemplate: `%s - ${siteName}`,
      title: siteName,
      description: meta.description || '',
    });
  },
});
