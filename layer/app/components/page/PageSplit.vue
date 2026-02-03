<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /**
   * Maximum width for the split container
   * @default "7xl"
   */
  maxWidth?: 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'
  /**
   * Gap between columns
   * @default "8"
   */
  gap?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxWidth: '7xl',
  gap: 8,
})

const maxWidthClass = computed(() => {
  const widthMap = {
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full',
  }
  return widthMap[props.maxWidth]
})

const gapClass = computed(() => `gap-${props.gap}`)
</script>

<template>
  <div :class="[maxWidthClass, 'mx-auto w-full']">
    <div :class="['grid lg:grid-cols-2 items-start', gapClass]">
      <!-- Left slot -->
      <div
        v-if="$slots.left"
        class="w-full h-full"
      >
        <slot name="left" />
      </div>

      <!-- Right slot -->
      <div
        v-if="$slots.right"
        class="w-full h-full"
      >
        <slot name="right" />
      </div>
    </div>
  </div>
</template>
