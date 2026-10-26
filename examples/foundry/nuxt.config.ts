import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

const SITE_URL
  = process.env.NUXT_PUBLIC_SITE_URL || 'https://foundry.incubrain.org'

export default defineNuxtConfig({
  extends: ['@incubrain/foundry'],

  // nuxt-llms ships from the layer itself now (product-validator-m0f.9) —
  // this `llms` config below is a full override of the layer's defaults,
  // proving consumer config still wins.
  modules: ['nuxt-studio'],

  css: [resolve('./app/assets/css/station.css')],

  site: {
    name: 'Foundry',
    url: SITE_URL,
    description:
      'A Nuxt 4 layer that wraps your website in a recording instrument — every visit, capture, and error, human or machine, streamed raw to where you decide.',
  },

  // The station is a dark instrument; the world commits to it.
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
  },

  routeRules: {
    '/': { appLayout: 'landing' },
  },

  // Scheduled blog: /blog + /blog/<slug>, posts live at their publishAt.
  foundry: {
    blog: { enabled: true },
  },

  llms: {
    domain: SITE_URL,
    title: 'Foundry — Signal Station',
    description:
      'Open-source Nuxt 4 validation layer: wraps a website in a signal-recording instrument (captures, events, errors, visitor classification human|agent|bot) with a pull-based export, MCP tools, and an agent-first surface. MIT licensed.',

    sections: [
      {
        title: 'Overview',
        description:
          'The full system on one page: the agent-traffic reading, the wrap/stream/decide loop, signal channels, agent-first surfaces, and the honest station log.',
        contentCollection: 'pages',
        contentFilters: [{ field: 'path', operator: '=', value: '/' }],
      },
      {
        title: 'Blog',
        description: 'Posts that are live now. Drafts and scheduled posts are not listed.',
        contentCollection: 'blog',
      },
    ],

    notes: [
      'Open source, MIT license: https://github.com/incubrain/foundry',
      'Install: npm i @incubrain/foundry (Nuxt 4 layer)',
      'MCP tools available on Foundry sites: list-pages, get-page, what-changed',
      'Signal export: GET /api/_signals/export (bearer token, pull-based)',
      'Every signal row is classified human | agent | bot',
    ],
  },

  rss: {
    feeds: {},
  },

  studio: {
    route: '/_studio',
    repository: {
      provider: 'github',
      owner: 'incubrain',
      repo: 'foundry',
      branch: 'main',
      rootDir: resolve('./'),
      private: false,
    },
  },
})
