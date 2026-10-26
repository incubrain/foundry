import {
  addImports,
  addServerHandler,
  addServerPlugin,
  createResolver,
  defineNuxtModule,
  extendPages,
} from '@nuxt/kit'
import { defu } from 'defu'
import type { BlogModuleOptions, BlogRuntimeConfig } from './runtime/types'

const DEFAULTS = { enabled: false, prefix: '/blog', title: 'Blog' }

export default defineNuxtModule<BlogModuleOptions>({
  meta: {
    name: 'foundry-blog',
    configKey: 'foundry',
    compatibility: { nuxt: '>=4.0.0' },
  },

  defaults: { blog: DEFAULTS },

  setup(options, nuxt) {
    const blog = { ...DEFAULTS, ...options.blog }
    if (!blog.enabled) return

    const resolver = createResolver(import.meta.url)
    const prefix = `/${blog.prefix.replace(/^\/+|\/+$/g, '')}`
    const runtime: BlogRuntimeConfig = { prefix, title: blog.title }
    nuxt.options.runtimeConfig.public.foundryBlog = runtime

    // Pages: the list and one post. More specific than the catch-all, so they win.
    extendPages((pages) => {
      pages.push(
        { name: 'foundry-blog', path: prefix, file: resolver.resolve('./runtime/pages/BlogIndex.vue') },
        { name: 'foundry-blog-post', path: `${prefix}/:slug`, file: resolver.resolve('./runtime/pages/BlogPost.vue') },
      )
    })
    addImports([
      { name: 'useBlogPosts', from: resolver.resolve('./runtime/composables/useBlogPosts') },
      { name: 'useBlogPost', from: resolver.resolve('./runtime/composables/useBlogPosts') },
      { name: 'useBlogSeo', from: resolver.resolve('./runtime/composables/useBlogSeo') },
    ])

    // Server: data endpoints, the feed, the leak guard, and the llms/sitemap filter.
    addServerHandler({ route: '/api/_foundry/blog/posts', method: 'get', handler: resolver.resolve('./server/api/posts.get.ts') })
    addServerHandler({ route: '/api/_foundry/blog/post', method: 'get', handler: resolver.resolve('./server/api/post.get.ts') })
    addServerHandler({ route: `${prefix}/rss.xml`, method: 'get', handler: resolver.resolve('./server/routes/rss.xml.get.ts') })
    addServerHandler({ middleware: true, handler: resolver.resolve('./server/middleware/guard.ts') })
    addServerPlugin(resolver.resolve('./server/plugins/discovery.ts'))

    // Render-time scheduling: a post goes live between deploys, so these routes
    // must never be baked into static HTML (the layer prerenders with
    // crawlLinks in CI) nor held by a cache past the request. `/raw<prefix>/**`
    // is Nuxt Content's raw-markdown route, which its llms module announces to
    // the prerenderer (`x-nitro-prerender`) for EVERY post, scheduled ones
    // included — a prerender 404 there would fail a CI build.
    const rule = {
      prerender: false,
      headers: { 'cache-control': 'public, max-age=0, must-revalidate' },
    }
    nuxt.options.routeRules = defu(nuxt.options.routeRules, {
      [prefix]: rule,
      [`${prefix}/**`]: rule,
      [`/raw${prefix}/**`]: { prerender: false },
    })
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    nuxt.options.nitro.prerender ||= {}
    nuxt.options.nitro.prerender.ignore = [
      ...(nuxt.options.nitro.prerender.ignore || []),
      new RegExp(`^(/raw)?${escaped}(/|$)`),
    ]
  },
})

export type { BlogModuleOptions, BlogOptions, BlogPost, BlogPostSummary } from './runtime/types'
