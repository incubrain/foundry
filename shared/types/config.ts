// shared/types/config.ts
import type { ButtonProps } from '@nuxt/ui';

export type ConfigSource = 'founder-funnel' | 'root';

// Keep HeroCta as used by Hero specialized component
export interface HeroCta {
  primary: string;
  secondary: string;
  secondaryIcon?: string;
}
