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
      // Docs with custom prefix
      docs: { name: 'docs', prefix: '/darksky' },
      // Glossary with custom prefix
      glossary: { name: 'glossary', prefix: '/resources/glossary' },
      // Simple string collections
      references: 'references',
      navigation: 'navigation',
      config: 'config',
      searchable: ['docs'],
    },
    routing: {
      sources: '/resources/references',
    },
  },
});
