<script setup lang="ts">
import { ref, computed } from 'vue';
import { useIntersectionObserver, useScroll } from '@vueuse/core';
import type { PageHeroProps, PageHeroSlots } from '@nuxt/ui';

const props = defineProps<PageHeroProps>();
const heroRef = ref<HTMLElement | null>(null);

const { trackEvent } = useEvents();
const hasTriggered = ref(false);

const { stop } = useIntersectionObserver(
  heroRef,
  ([entry]) => {
    if (!entry?.isIntersecting || hasTriggered.value) return;

    hasTriggered.value = true;

    trackEvent({
      id: 'hero_view',
      type: 'hero_view',
      target: 'page_hero',
    });

    stop();
  },
  { threshold: 0.2 },
);

// Extend slots to include overlap slot
interface ExtendedSlots extends PageHeroSlots {
  overlap(): any;
}

defineSlots<ExtendedSlots>();
</script>

<template>
  <div class="relative ">
    <!-- Fixed Hero Background -->
    <div 
      class="sticky top-0 left-0 w-full h-screen -z-10"
    >
      <div ref="heroRef" class="h-full bg-[url(https://picsum.photos/640/728)] bg-top bg-left bg-cover">
        <UPageHero v-bind="$props">
          <template v-for="(_, slot) in $slots" #[slot]="scope">
            <slot 
              v-if="slot !== 'overlap'" 
              :name="(slot as keyof PageHeroSlots)" 
              v-bind="scope || {}" 
            />
          </template>
        </UPageHero>
      </div>
    </div>
    
    <!-- Content that scrolls over hero -->
    <div class="relative min-h-screen bg-default">
      <slot name="overlap" />
    </div>
  </div>
</template>