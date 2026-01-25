export default defineAppConfig({
  title: 'AstronEra - Dark Sky Maharashtra',
  description:
    'Authoritative resource on light pollution policy and dark sky preservation in Maharashtra, India',

  url: 'https://darksky.maharashtra.gov.in',

  aside: {
    level: 1,
    collapsed: false,
  },

  logo: {
    light: '/icon-192x192.png',
    dark: '/icon-192x192.png',
    alt: 'AstronEra Logo',
  },

  searchableCollections: ['landing'],

  routing: {
    glossary: '/resources/glossary',
  },

  contentCollections: {
    glossary: 'glossary',
    references: 'references',
    navigation: 'navigation',
  },
});
