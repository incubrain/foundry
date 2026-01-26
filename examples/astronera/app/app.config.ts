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

  searchableCollections: ['docs'],

  routing: {
    docs: '/darksky',
    glossary: '/resources/glossary',
    references: '/resources/references',
  },

  contentCollections: {
    glossary: 'glossary',
    references: 'references',
    navigation: 'navigation',
    config: 'config',
  },
});
