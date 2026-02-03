export default defineAppConfig({
  // Content configuration
  // Each collection can be:
  // - string: name only (for data collections)
  // - object: { name, type: 'page'|'data', prefix?, backLabel? }
  content: {
    collections: {
      // Page collections (routable - type: 'page')
      docs: { name: 'docs', type: 'page', prefix: '/docs' },
      pages: {
        name: 'pages',
        type: 'page',
        prefix: '/',
        backLabel: 'Back to Articles',
      },
      // Data collections (not routable - type: 'data' or string shorthand)
      references: { name: 'references', type: 'data' },
      glossary: { name: 'glossary', type: 'data' },
      faq: { name: 'faq', type: 'data' },
      config: { name: 'config', type: 'data' },
      navigation: { name: 'navigation', type: 'data' },
      // Collections to include in search
      searchable: ['docs'],
    },
    // Additional routing paths (not tied to a specific collection)
    routing: {
      sources: '/sources',
      offers: '/offers',
      success: '/success',
    },
  },
  ui: {
    colors: {
      primary: 'primary',
      secondary: 'secondary',
      neutral: 'neutral',
      success: 'success',
      warning: 'warning',
      error: 'error',
      info: 'info',
    },
    icons: {
      arrowDown: 'i-lucide-arrow-down',
      arrowLeft: 'i-lucide-arrow-left',
      arrowRight: 'i-lucide-arrow-right',
      arrowUp: 'i-lucide-arrow-up',
      caution: 'i-lucide-circle-alert',
      check: 'i-lucide-check',
      chevronDoubleLeft: 'i-lucide-chevrons-left',
      chevronDoubleRight: 'i-lucide-chevrons-right',
      chevronDown: 'i-lucide-chevron-down',
      chevronLeft: 'i-lucide-chevron-left',
      chevronRight: 'i-lucide-chevron-right',
      chevronUp: 'i-lucide-chevron-up',
      close: 'i-lucide-x',
      copy: 'i-lucide-copy',
      copyCheck: 'i-lucide-copy-check',
      dark: 'i-lucide-moon',
      drag: 'i-lucide-grip-vertical',
      ellipsis: 'i-lucide-ellipsis',
      error: 'i-lucide-circle-x',
      external: 'i-lucide-arrow-up-right',
      eye: 'i-lucide-eye',
      eyeOff: 'i-lucide-eye-off',
      file: 'i-lucide-file',
      folder: 'i-lucide-folder',
      folderOpen: 'i-lucide-folder-open',
      hash: 'i-lucide-hash',
      info: 'i-lucide-info',
      light: 'i-lucide-sun',
      loading: 'i-lucide-loader-circle',
      menu: 'i-lucide-menu',
      minus: 'i-lucide-minus',
      panelClose: 'i-lucide-panel-left-close',
      panelOpen: 'i-lucide-panel-left-open',
      plus: 'i-lucide-plus',
      reload: 'i-lucide-rotate-ccw',
      search: 'i-lucide-search',
      stop: 'i-lucide-square',
      success: 'i-lucide-circle-check',
      system: 'i-lucide-monitor',
      tip: 'i-lucide-lightbulb',
      upload: 'i-lucide-upload',
      warning: 'i-lucide-triangle-alert',
      // CUSTOM ICONS
      statusAvailable: 'i-lucide-check',
      statusBeta: 'i-lucide-flask-conical',
      statusComingSoon: 'i-lucide-clock',
      // SOCIAL
      youtube: 'i-lucide-youtube',
      github: 'i-lucide-github',
      x: 'i-lucide-twitter',
      linkedin: 'i-lucide-linkedin',
      website: 'i-lucide-globe',
    },
    formField: {
      defaultVariants: {
        size: 'xl',
      },
    },
    button: {
      defaultVariants: {
        color: 'secondary',
        variant: 'solid',
        size: 'md',
      },
    },
    pageFeature: {
      slots: {
        root: 'relative',
        wrapper: '',
        leading: 'inline-flex items-center justify-center',
        leadingIcon: 'size-5 shrink-0 text-secondary',
        title: 'text-base text-pretty font-semibold text-highlighted',
        description: 'text-[15px] text-pretty text-muted',
      },
    },
    commandPalette: {
      slots: {
        item: 'items-center',
        input: '[&_.iconify]:size-4 [&_.iconify]:mx-0.5',
        itemLeadingIcon: 'size-4 mx-0.5',
      },
    },
    contentNavigation: {
      slots: {
        linkLeadingIcon: 'size-4 mr-1',
        linkTrailing: 'hidden',
      },
      defaultVariants: {
        variant: 'link',
      },
    },
    pageLinks: {
      slots: {
        linkLeadingIcon: 'size-4',
        linkLabelExternalIcon: 'size-2.5',
      },
    },
  },
})
