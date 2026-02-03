export default defineAppConfig({
  title: 'Founder Funnel',
  description:
    'Authoritative resource on light pollution policy and dark sky preservation in Maharashtra, India',

  url: 'https://darksky.maharashtra.gov.in',

  aside: {
    level: 1,
    collapsed: false,
  },

  logo: {
    light: '/favicon-96x96.png',
    dark: '/favicon-96x96.png',
    alt: 'Founder Funnel Logo',
  },

  content: {
    collections: {
      // Data collections (not routable)
      glossary: { name: 'glossary', type: 'data' },
      references: { name: 'references', type: 'data' },
      navigation: { name: 'navigation', type: 'data' },
      searchable: ['pages'],
    },
  },
})
