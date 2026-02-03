export default defineAppConfig({
  title: 'My Product',
  description: 'One-sentence value proposition for your product',

  url: 'http://localhost:3000',

  logo: {
    light: '/favicon-96x96.png',
    dark: '/favicon-96x96.png',
    alt: 'My Product Logo',
  },

  content: {
    collections: {
      // Data collections (not routable)
      navigation: { name: 'navigation', type: 'data' },
      config: { name: 'config', type: 'data' },
      searchable: ['pages'],
    },
    routing: {
      offers: '/offers',
      success: '/success',
    },
  },
})
