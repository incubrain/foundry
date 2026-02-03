export default defineNuxtConfig({
  extends: ['@incubrain/foundry'],

  modules: ['nuxt-studio', 'nuxt-llms'],

  site: {
    name: 'Your Product',
    url: 'https://your-domain.com',
  },

  llms: {
    domain: 'https://your-domain.com',
    title: 'Your Product',
    description: 'Your Product',
    notes: [
      'The documentation only includes Your Product docs.',
      'The content is automatically generated from the same source as the official documentation.',
    ],
    full: {
      title: 'Complete Documentation',
      description: 'The complete documentation including all content',
    },
  },
})
