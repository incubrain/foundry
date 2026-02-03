import { defineNuxtModule, createResolver } from '@nuxt/kit'
import { defu } from 'defu'
import { inferSiteURL, getPackageJsonMetadata } from '../shared/utils/meta'
import { readFile } from 'node:fs/promises'

export default defineNuxtModule({
  meta: {
    name: 'config',
  },
  async setup(_options, nuxt) {
    const dir = nuxt.options.rootDir
    const url = inferSiteURL()
    const meta = await getPackageJsonMetadata(dir)

    // Read layer package.json for foundry version
    const { resolve } = createResolver(import.meta.url)
    const layerPkgPath = resolve('../package.json')
    let foundryVersion = ''
    try {
      const layerPkg = JSON.parse(await readFile(layerPkgPath, 'utf-8'))
      foundryVersion = layerPkg.version || ''
    }
    catch {
      // Ignore if package.json not found
    }
    const siteName = nuxt.options?.site?.name || meta.name || ''

    nuxt.options.llms = defu(nuxt.options.llms, {
      domain: url,
      title: siteName,
      description: meta.description || '',
      full: {
        title: siteName,
        description: meta.description || '',
      },
    })

    nuxt.options.site = defu(nuxt.options.site, {
      url,
      name: siteName,
      debug: false,
    })

    nuxt.options.appConfig.header = defu(nuxt.options.appConfig.header, {
      title: siteName,
    })

    nuxt.options.appConfig.seo = defu(nuxt.options.appConfig.seo, {
      titleTemplate: `%s - ${siteName}`,
      title: siteName,
      description: meta.description || '',
    })

    nuxt.options.appConfig.foundry = defu(nuxt.options.appConfig.foundry, {
      version: foundryVersion,
      url: 'https://foundry.incubrain.org',
    })
  },
})
