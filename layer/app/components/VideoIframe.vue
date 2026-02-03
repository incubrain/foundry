<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'

interface Props {
  src: string
  title?: string
  aspectRatio?: 'square' | 'video' | 'portrait' | 'wide'
  loading?: 'eager' | 'lazy'
}

const props = withDefaults(defineProps<Props>(), {
  title: 'video',
  aspectRatio: 'video',
  loading: 'lazy',
})

const containerRef = ref<HTMLElement>()
const shouldLoad = ref(props.loading === 'eager')

if (props.loading === 'lazy') {
  useIntersectionObserver(
    containerRef,
    ([{ isIntersecting }]) => {
      if (isIntersecting && !shouldLoad.value) {
        shouldLoad.value = true
      }
    },
    { threshold: 0.1 },
  )
}

const aspectRatioClass = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  wide: 'aspect-[21/9]',
}[props.aspectRatio]
</script>

<template>
  <div
    ref="containerRef"
    :class="['relative w-full', aspectRatioClass]"
  >
    <iframe
      v-if="shouldLoad"
      :src="src"
      :title="title"
      class="absolute inset-0 w-full h-full rounded-lg"
      frameborder="0"
      allow="
        accelerometer;
        autoplay;
        clipboard-write;
        encrypted-media;
        gyroscope;
        picture-in-picture;
      "
      allowfullscreen
    />
    <div
      v-else
      class="absolute inset-0 flex items-center justify-center bg-black rounded-lg"
    >
      <UIcon
        name="i-lucide-video"
        class="size-8 text-white/50"
      />
    </div>
  </div>
</template>
