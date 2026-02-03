<script setup lang="ts">
import { useSlots, cloneVNode } from 'vue' // For VNode handling
import { computed } from 'vue'

const slots = useSlots()
const rawItems = computed(() => slots.default?.() || []) // Array of VNodes from slots

// Optional duplication (if loop prop isn't sufficient)
const allItems = computed(() => {
  const items = rawItems.value
  return [...items, ...items.map(vnode => cloneVNode(vnode))] // Clone for uniqueness
})
</script>

<template>
  <div
    v-if="allItems.length"
    class="overflow-hidden"
  >
    <UCarousel
      v-slot="{ item }"
      :items="allItems"
      arrows
      loop
      :prev="{ size: 'xl', square: true }"
      :next="{ size: 'xl', square: true }"
      :ui="{
        item: 'basis-[320px] px-2 min-h-[360px] h-full',
        viewport: 'overflow-hidden p-4',
        controls: 'relative my-12 hidden md:flex justify-center max-w-container mx-auto',
        arrows: 'flex gap-4',
        prev: 'flex relative rounded-lg ring-default start-0 sm:start-0 top-0 translate-y-0',
        next: 'flex relative rounded-lg ring-default end-0 sm:end-0 top-0 translate-y-0',
      }"
    >
      <!-- Render each VNode as the slide content -->
      <component :is="item" />
    </UCarousel>
  </div>
</template>
