import {
  defineNuxtModule,
  addPlugin,
  addImports,
  createResolver,
  addServerHandler,
  addServerPlugin,
  addComponentsDir,
  addTypeTemplate,
} from '@nuxt/kit'
import type { ModuleOptions } from './runtime/types/events'

// Kept in sync with `DEFAULT_SIGNAL_CAPACITY` in ./server/utils/signal-buffer.ts.
// Not imported directly: that file is nitro-server-only (relies on h3/nitro
// auto-imports) and pulling it into this module-setup file drags it into the
// Nuxt "node" typecheck project, which doesn't have those globals.
const DEFAULT_SIGNAL_CAPACITY = 100_000

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'events',
    configKey: 'events',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },

  defaults: {
    signals: {
      enabled: true,
      capacity: DEFAULT_SIGNAL_CAPACITY,
      captureErrors: true,
    },
    debug: false,
  },

  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Ship the `RuntimeNuxtHooks` augmentation (`events:track` / `events:dev`)
    // into every consumer's generated types.
    //
    // `runtime/types/events-hooks.d.ts` is a loose ambient file. TypeScript
    // only picks it up when the layer itself is the project root (its own
    // generated tsconfig globs the layer's runtime dirs). A consumer that
    // extends the layer from `node_modules` never walks in to find it, so the
    // hook keys vanish and every `nuxtApp.hook('events:track', …)` /
    // `callHook('events:dev', …)` inside the shipped runtime fails with TS2345
    // ("not assignable to HookKeys<RuntimeNuxtHooks>") — errors pointing into
    // node_modules/@incubrain/foundry (product-validator-918).
    //
    // Same mechanism as the AppConfig augmentation in modules/config.ts:
    // `addTypeTemplate` pushes a `prepare:types` reference into the build's
    // generated `nuxt.d.ts` (and into vite's `globalTypeFiles`, so `.vue`
    // SFCs see it too) no matter which layer's module registered it.
    //
    // The contents are re-emitted rather than the file re-referenced because
    // the ambient file's `./events` import is relative to its own directory.
    // Deliberately app-project only (no `node`/`nitro` context): a
    // `declare module 'nuxt/app'` augmentation in the node tsconfig project
    // fails with TS2664, which is why the ambient file was split out of
    // `runtime/types/events.ts` in the first place.
    const eventsTypesPath = resolver
      .resolve('./runtime/types/events')
      .replace(/\\/g, '/')
    addTypeTemplate({
      filename: 'types/foundry-events-hooks.d.ts',
      getContents: () => `import type { EventsHooks } from ${JSON.stringify(eventsTypesPath)}

declare module 'nuxt/app' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface RuntimeNuxtHooks extends EventsHooks {}
}
`,
    })

    // Add core plugin (always)
    addPlugin({
      src: resolver.resolve('./runtime/plugins/events.client.ts'),
      mode: 'client',
    })

    // Register components
    addComponentsDir({
      path: resolver.resolve('./runtime/components'),
      watch: true,
    })

    // Auto-import useEvents composable
    addImports({
      name: 'useEvents',
      from: resolver.resolve('./runtime/composables/useEvents.ts'),
    })

    // Expose to runtime config
    nuxt.options.runtimeConfig.public.events = {
      debug: options.debug,
    }

    // Form capture route — zod validation + anti-spam, then into the buffer.
    addServerHandler({
      route: '/api/v1/webhook',
      method: 'post',
      handler: resolver.resolve('./server/handlers/webhook.post'),
    })

    // === Signal capture (buffer + cursor export for external consumers) ===
    if (options.signals.enabled) {
      nuxt.options.runtimeConfig.signals = {
        capacity: options.signals.capacity,
      }

      addServerHandler({
        route: '/api/_signals/ingest',
        method: 'post',
        handler: resolver.resolve('./server/handlers/signals-ingest.post'),
      })

      addServerHandler({
        route: '/api/_signals/export',
        method: 'get',
        handler: resolver.resolve('./server/handlers/signals-export.get'),
      })

      // Server-side page visits. The client identity stream only ever sees
      // visitors that run JS; this is the ingest path for the ones that don't
      // (GPTBot, ClaudeBot, PerplexityBot, no-JS browsers). Emits `page_request`
      // — deliberately NOT `ui.page`, see server/utils/page-request.ts.
      addServerHandler({
        middleware: true,
        handler: resolver.resolve('./server/middleware/page-request'),
      })

      // The only provider: every tracked event becomes a signal row
      addPlugin({
        src: resolver.resolve('./runtime/providers/signal.ts'),
        mode: 'client',
      })

      // Always-on identity stream: ui.click / ui.section / ui.page.
      addPlugin({
        src: resolver.resolve('./runtime/plugins/identity.client.ts'),
        mode: 'client',
      })

      if (options.signals.captureErrors) {
        addPlugin({
          src: resolver.resolve('./runtime/plugins/errors.client.ts'),
          mode: 'client',
        })
        addServerPlugin(resolver.resolve('./server/plugins/signal-errors'))
      }
    }
  },
})

// Export types
export type {
  ModuleOptions,
  EventPayload,
  TrackEventInput,
} from './runtime/types/events'

export type {
  SignalRow,
  SignalInput,
  SignalKind,
  SignalSeverity,
  SignalExportResponse,
} from './runtime/types/signal'
