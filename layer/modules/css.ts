import { defineNuxtModule, addTemplate, createResolver } from '@nuxt/kit'
import { joinURL } from 'ufo'
import { resolveModulePath } from 'exsolve'

export default defineNuxtModule({
  meta: {
    name: 'css',
  },
  async setup(_options, nuxt) {
    const dir = nuxt.options.rootDir
    const resolver = createResolver(import.meta.url)

    const contentDir = joinURL(dir, 'content')
    const uiPath = resolveModulePath('@nuxt/ui', {
      from: import.meta.url,
      conditions: ['style'],
    })
    const tailwindPath = resolveModulePath('tailwindcss', {
      from: import.meta.url,
      conditions: ['style'],
    })
    const layerDir = resolver.resolve('../app')

    // `write: true` is load-bearing in dev: without it the template exists only in
    // Nuxt's in-memory VFS, so Vite's `/_nuxt/@fs/<buildDir>/docus.css` stylesheet
    // link (emitted next to the virtual one) 404s on every page. @nuxt/ui's ui.css
    // does the same.
    const cssTemplate = addTemplate({
      filename: 'docus.css',
      write: true,
      getContents: () => {
        return `@import ${JSON.stringify(tailwindPath)};
@import ${JSON.stringify(uiPath)};

@source "${contentDir.replace(/\\/g, '/')}/**/*";
@source "${layerDir.replace(/\\/g, '/')}/**/*";
@source "../../app.config.ts";`
      },
    })

    ;(nuxt.options.css as string[]).unshift(cssTemplate.dst)
  },
})
