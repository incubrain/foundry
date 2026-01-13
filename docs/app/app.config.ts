export default defineAppConfig({
  socials: {
    x: 'https://x.com/AstronEra',
    gmail: 'mailto:connectus@astronera.org',
    linkedin: 'https://www.linkedin.com/in/shwetakulkarni/',
  },
  docus: {
    title: 'Dark Sky Maharashtra',
    description:
      'Authoritative resource on light pollution policy and dark sky preservation in Maharashtra, India',

    url: 'https://darksky.maharashtra.gov.in',

    aside: {
      level: 1,
      collapsed: false,
    },

    header: {
      logo: false,
      showTitle: true,
      title: 'Dark Sky Maharashtra',
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
  },
});
