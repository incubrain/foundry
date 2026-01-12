import type { IconProps } from '@nuxt/ui';

export const STATUS_ICONS: Record<string, IconProps & { class: string }> = {
  'status-available': { name: 'i-lucide-check', class: 'text-success' },
  'status-beta': { name: 'i-lucide-flask-conical', class: 'text-info' },
  'status-coming-soon': { name: 'i-lucide-clock', class: 'text-warning' },
};

/**
 * Icon Library Configuration
 *
 * This file centralizes icon library configuration to ensure consistency across:
 *
 * 1. **Nuxt Config** (`nuxt.config.ts`):
 *    - Used in `icon.serverBundle.collections` to tree-shake
 *
 * 2. **Content Config** (`content.config.ts`):
 *    - Used in `property().editor({ iconLibraries })` to configure which icon
 *      libraries are available in the Nuxt Studio icon picker
 */

export const ICON_LIBRARIES = [
  'lucide',
  'mdi',
  'logos',
  'simple-icons',
] as const;

export type IconLibrary = (typeof ICON_LIBRARIES)[number];
