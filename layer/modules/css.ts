import { existsSync, readFileSync } from 'node:fs'
import { defineNuxtModule, addTemplate, createResolver, logger, resolvePath } from '@nuxt/kit'
import { joinURL } from 'ufo'
import { resolveModulePath } from 'exsolve'

const log = logger.withTag('foundry')

// A stylesheet that brings its own Tailwind compiler (`@import 'tailwindcss'` or a
// `tailwindcss/*` partial). Every one of these in `css:` is a whole extra compile.
const IMPORTS_TAILWIND = /@import\s+(?:url\(\s*)?['"]tailwindcss(?:\/[^'"]*)?['"]/
// Directives that only mean something inside a Tailwind compilation.
const USES_TAILWIND = /@(?:theme|utility|apply|variant|custom-variant|plugin|source|config|reference)\b|--(?:theme|spacing|alpha)\(/
const COMMENTS = /\/\*[\s\S]*?\*\//g

/**
 * Exactly one Tailwind compilation per site.
 *
 * The generated `docus.css` is the only stylesheet that imports `tailwindcss` and
 * `@nuxt/ui`. The layer's `main.css` and any site stylesheet in `css:` that uses
 * Tailwind directives (`@theme`, `@utility`, `@apply`, …) are `@import`ed into it, in
 * that order, so site `@theme` tokens override the layer's and generate utilities.
 * Plain CSS in `css:` is left where it is. Contract: layer README, "Styling".
 */
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
    const imports = [tailwindPath, uiPath, resolver.resolve('../app/assets/main.css')]

    // `write: true` is load-bearing in dev: without it the template exists only in
    // Nuxt's in-memory VFS, so Vite's `/_nuxt/@fs/<buildDir>/docus.css` stylesheet
    // link (emitted next to the virtual one) 404s on every page. @nuxt/ui's ui.css
    // does the same.
    const cssTemplate = addTemplate({
      filename: 'docus.css',
      write: true,
      getContents: () => {
        return `${imports.map(path => `@import ${JSON.stringify(path.replace(/\\/g, '/'))};`).join('\n')}

@source "${contentDir.replace(/\\/g, '/')}/**/*";
@source "${layerDir.replace(/\\/g, '/')}/**/*";
@source "../../app.config.ts";`
      },
    })

    // Runs after every module, so stylesheets other modules push into `css:` are seen too.
    nuxt.hook('modules:done', async () => {
      const css = nuxt.options.css as string[]
      for (const entry of [...css]) {
        if (typeof entry !== 'string' || entry === cssTemplate.dst) continue
        const path = await resolvePath(entry)
        if (!path.endsWith('.css') || !existsSync(path)) continue

        const source = readFileSync(path, 'utf8').replace(COMMENTS, '')
        if (IMPORTS_TAILWIND.test(source)) {
          log.warn(
            `${entry} imports tailwindcss, so Tailwind compiles twice and the CSS ships twice. `
            + 'Remove its `@import \'tailwindcss\'` and `@import \'@nuxt/ui\'` lines: the layer '
            + 'already compiles your Tailwind CSS once (layer README, "Styling").',
          )
          continue
        }
        if (!USES_TAILWIND.test(source)) continue

        css.splice(css.indexOf(entry), 1)
        imports.push(path)
      }
    })

    ;(nuxt.options.css as string[]).unshift(cssTemplate.dst)
  },
})
