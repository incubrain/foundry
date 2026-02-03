import type { TrackedEvents } from '../types/events'

export const EVENT_METADATA: Partial<
  Record<
    TrackedEvents,
    {
      label: string
      description: string
      icon: string
      category: 'form' | 'conversion' | 'engagement'
    }
  >
> = {
  form_submitted: {
    label: 'Form Submit',
    description: 'Form submitted successfully',
    icon: 'i-lucide-check-circle',
    category: 'form',
  },
  form_error: {
    label: 'Form Error',
    description: 'Form validation failed',
    icon: 'i-lucide-alert-circle',
    category: 'form',
  },
  offer_click: {
    label: 'Offer Click',
    description: 'User clicked on offer/CTA',
    icon: 'i-lucide-mouse-pointer-click',
    category: 'conversion',
  },
  section_view: {
    label: 'Section View',
    description: 'Section came into viewport',
    icon: 'i-lucide-eye',
    category: 'engagement',
  },
} as const
