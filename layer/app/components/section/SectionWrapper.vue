<script setup lang="ts">
import { ref } from 'vue';
import { useIntersectionObserver } from '@vueuse/core';
import type { PageSectionProps } from '@nuxt/ui';

const props = defineProps<PageSectionProps>();
const sectionRef = ref<HTMLElement | null>(null);

const { trackEvent } = useEvents();
const hasTriggered = ref(false);

const { stop } = useIntersectionObserver(
  sectionRef,
  ([entry]) => {
    if (!entry?.isIntersecting || hasTriggered.value) return;

    hasTriggered.value = true;

    const id = sectionRef.value?.getAttribute('id');
    if (id) {
      trackEvent({
        id: `section_view_${id}`,
        type: 'section_view',
        target: id,
      });
    }

    stop();
  },
  { threshold: 0.2 },
);
</script>

<template>
  <UPageSection ref="sectionRef" v-bind="props">
    <!-- Forward slots WITHOUT binding slot props -->
    <template v-for="(_, name) in $slots" #[name]>
      <slot :name="name" />
    </template>
  </UPageSection>
</template>
