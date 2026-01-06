export default defineAppConfig({
  icon: {
    aliases: {
      'arrow-left': 'lucide:arrow-left',
      'arrow-right': 'lucide:arrow-right',
      'check': 'lucide:check',
      'close': 'lucide:x',
      'search': 'lucide:search',
      // {DX}: Product status icon aliases
      'status-available': 'lucide:check',
      'status-beta': 'lucide:flask-conical',
      'status-coming-soon': 'lucide:clock',
      // Social platform icons
      'youtube': 'lucide:youtube',
      'github': 'lucide:github',
      'x': 'lucide:twitter',
      'linkedin': 'lucide:linkedin',
      'website': 'lucide:globe',
    },
  },
  ui: {
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
  },
});
