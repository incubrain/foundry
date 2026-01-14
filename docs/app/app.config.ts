export default defineAppConfig({
  headerLink: 'x',
  socials: {
    x: 'https://x.com/AstronEra',
    gmail: 'mailto:connectus@astronera.org',
    linkedin: 'https://www.linkedin.com/in/shwetakulkarni/',
  },
  title: 'AstronEra - Dark Sky Maharashtra',
  description:
    'Authoritative resource on light pollution policy and dark sky preservation in Maharashtra, India',

  url: 'https://darksky.maharashtra.gov.in',

  aside: {
    level: 1,
    collapsed: false,
  },
  showHeaderTitle: true,
  header: {
    title: 'AstronEra Content',
    logo: {
      light: 'icon-192x192.png',
      dark: 'icon-192x192.png',
    },
  },

  footer: {
    credits: 'Copyright © 2026 AstronEra',
    textLinks: [
      {
        text: 'Sources',
        href: '/sources',
      },
    ],
  },
});
