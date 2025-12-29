<!-- app/components/convert/Social.vue -->
<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui';

interface Props {
  location: string;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  color?: ButtonProps['color'];
  rounded?: boolean;
  gap?: 'tight' | 'normal' | 'relaxed';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'xl',
  variant: 'subtle',
  color: 'secondary',
  rounded: true,
  gap: 'normal',
});

const { getFounder } = useContentCache();
const { data: founder } = await getFounder();
const { trackEvent } = useEvents();

const gapClasses = {
  tight: 'gap-1',
  normal: 'gap-3',
  relaxed: 'gap-4',
};

const handleClick = (platform: string, url: string) => {
  trackEvent({
    id: `offer_click_${props.location}_${platform.toLocaleLowerCase()}`,
    type: 'offer_click',
    target: 'social_external',
  });
};
</script>

<template>
  <div v-if="founder?.links?.length" :class="['flex', gapClasses[gap]]">
    <UButton
      v-for="link in founder.links"
      :key="link.url"
      :icon="link.icon"
      :to="link.url"
      external
      target="_blank"
      :size="size"
      :variant="variant"
      :color="color"
      :class="[
        rounded ? 'rounded-full text-default' : '',
        size === 'xl' && rounded ? 'p-3' : '',
      ]"
      :aria-label="`Visit ${founder.given_name}'s ${link.label}`"
      @click="handleClick(link.label, link.url)"
    />
  </div>
</template>
