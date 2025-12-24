<!-- app/components/section/SectionWrapper.vue -->
<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core';
import type { SectionId } from '#shared/config/navigation';

interface Props {
  id: SectionId;
  intro: {
    title: string;
    description: string;
  };
  cta?: SectionCta;
  orientation?: 'vertical' | 'horizontal';
  class?: string;
  hasBottom?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  orientation: 'vertical',
  class: '',
  cta: null,
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
        target: props.id, // SectionId
      });
    }
  },
  {
    threshold: 0.2,
    // @ts-ignore - triggerOnce is valid in usage but types might be strict
    triggerOnce: true,
  },
);
</script>

<template>
  <UPageSection
    ref="sectionRef"
    :orientation="orientation"
    v-bind="intro"
    :class="props.class"
    :ui="{
      root: 'isolate',
      container: [
        'flex flex-col lg:grid py-24 sm:py-24 gap-12 sm:gap-16 lg:px-0',
        props.hasBottom ? 'lg:pb-0 pb-0' : 'lg:pb-32',
      ],
      header: 'space-y-3 mx-auto text-center relative z-100',
      leading: 'w-full lg:px-0 relative pb-4 z-100',
      headline: 'hidden',
      title: 'max-w-3xl mx-auto',
      description: 'text-sm sm:text-base text-dimmed max-w-xl mx-auto',
    }"
  >
    <template #top>
      <NavAnchor :id="id" />
    </template>

    <slot />

    <template #bottom>
      <div class="pt-12 lg:pt-16">
        <slot name="bottom" />
        <UContainer class="lg:px-0">
          <NavCta v-if="cta" :cta="cta" />
        </UContainer>
      </div>
    </template>
  </UPageSection>
</template>
