import {
  defineNuxtModule,
  addPlugin,
  addImports,
  createResolver,
  addServerHandler,
  addComponentsDir,
} from '@nuxt/kit';
import type { ModuleOptions } from './runtime/types/events';

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'events',
    configKey: 'events',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },

  defaults: {
    providers: ['console'], // Dev default
    webhook: {
      enabled: false,
      platforms: [],
    },
    debug: false,
  },

  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);

    // Add core plugin (always)
    addPlugin({
      src: resolver.resolve('./runtime/plugins/events.client.ts'),
      mode: 'client',
    });

    // Register components
    addComponentsDir({
      path: resolver.resolve('./runtime/components'),
      watch: true,
    });

    // Auto-import useEvents composable
    addImports({
      name: 'useEvents',
      from: resolver.resolve('./runtime/composables/useEvents.ts'),
    });

    addImports({
      name: 'useUserIdentity',
      from: resolver.resolve('./runtime/composables/useUserIdentity.ts'),
    });

    // Add selected provider plugins
    options.providers.forEach((provider) => {
      addPlugin({
        src: resolver.resolve(`./runtime/providers/${provider}.ts`),
        mode: 'client',
      });
    });

    // Always add webhook provider if webhook is enabled (client-side)
    // Actually, user should add 'webhook' to providers list if they want client-side triggering
    // But let's support it explicitly or implicit?
    // The previous logic had webhook handler specific for form_submitted.
    // Let's assume 'webhook' provider checks types internally.

    // Expose to runtime config
    nuxt.options.runtimeConfig.public.events = {
      debug: options.debug,
    };

    if (options.webhook.enabled) {
      // @ts-ignore
      addServerHandler({
        route: '/api/v1/webhook',
        method: 'post',
        handler: resolver.resolve('./server/handlers/webhook.post'),
      });
    }
  },
});

// Export types
export type {
  ModuleOptions,
  EventPayload,
  AnalyticsProvider,
} from './runtime/types/events';
