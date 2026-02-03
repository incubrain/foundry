export default defineAppConfig({
  title: 'AstronEra',
  description:
    'Authoritative resource on light pollution policy and dark sky preservation in Maharashtra, India',

  url: 'https://darksky.maharashtra.gov.in',

  logo: {
    light: '/icon-192x192.png',
    dark: '/icon-192x192.png',
    alt: 'AstronEra Logo',
  },

  aside: {
    level: 1,
    collapsed: false,
  },

  content: {
    collections: {
      // Page collections (routable)
      docs: { name: 'docs', type: 'page', prefix: '/darksky' },
      pages: { name: 'pages', type: 'page', prefix: '/' },
      // Data collections (not routable)
      glossary: { name: 'glossary', type: 'data' },
      references: { name: 'references', type: 'data' },
      navigation: { name: 'navigation', type: 'data' },
      config: { name: 'config', type: 'data' },
      searchable: ['docs'],
    },
    routing: {
      sources: '/resources/references',
    },
  },
});
