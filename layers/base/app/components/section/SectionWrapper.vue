<!-- app/components/section/SectionWrapper.vue -->
<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core';
import type { SectionId } from '#shared/navigation';

interface Props {
  id: SectionId | string;
  class?: string;
  hasBottom?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
  hasBottom: false,
});

const sectionRef = ref(null);
const { trackEvent } = useEvents();

useIntersectionObserver(
  sectionRef,
  ([{ isIntersecting }]) => {
    if (isIntersecting) {
      trackEvent({
        id: `section_view_${props.id}`,
        type: 'section_view',
        target: props.id,
      });
    }
  },
  {
    threshold: 0.2,
    triggerOnce: true,
  },
);
</script>

<template>
  <UPageSection
    ref="sectionRef"
    :class="props.class"
    :ui="{
      root: 'isolate',
      container: [
        'flex flex-col py-24 sm:py-24 gap-12 sm:gap-16 lg:px-0',
        props.hasBottom ? 'lg:pb-0 pb-0' : 'lg:pb-32',
        /* Ensure consistent padding for mobile/desktop */
      ],
    }"
  >
    <template #top>
      <NavAnchor :id="id" />
    </template>

    <slot />

    <slot name="cta" />

    <template #bottom>
      <div v-if="$slots.bottom" class="pt-12 lg:pt-16">
        <slot name="bottom" />
      </div>
    </template>
  </UPageSection>
</template>
