<script setup lang="ts">
import { useIntersectionObserver, useMediaControls } from '@vueuse/core';

interface Props {
  src: string;
  alt?: string;
  poster?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'wide' | 'auto';
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  loading?: 'eager' | 'lazy';
}

const props = withDefaults(defineProps<Props>(), {
  aspectRatio: 'video',
  alt: 'video',
  autoplay: false,
  muted: true,
  loop: false,
  loading: 'lazy',
  poster: undefined,
});

const containerRef = ref<HTMLElement>();
const videoRef = ref<HTMLVideoElement>();

const isLoading = ref(true);
const hasError = ref(false);
const shouldLoad = ref(props.loading === 'eager');
const showControls = ref(false);

const { playing, waiting, muted } = useMediaControls(videoRef, {
  src: computed(() => (shouldLoad.value ? props.src : '')),
});

if (props.loading === 'lazy') {
  useIntersectionObserver(
    containerRef,
    ([{ isIntersecting }]) => {
      if (isIntersecting && !shouldLoad.value) {
        shouldLoad.value = true;
      }
    },
    { threshold: 0.1 },
  );
}

const handleLoadedData = () => {
  isLoading.value = false;
  hasError.value = false;
};

const handleError = () => {
  isLoading.value = false;
  hasError.value = true;
};

const togglePlay = () => {
  playing.value = !playing.value;
};

const toggleMute = () => {
  muted.value = !muted.value;
};

// Autoplay logic
watchEffect(() => {
  if (
    videoRef.value &&
    props.autoplay &&
    props.muted &&
    shouldLoad.value &&
    !hasError.value
  ) {
    playing.value = true;
  }
});

watchEffect(() => {
  if (videoRef.value) {
    muted.value = props.muted;
  }
});

const aspectRatioClass = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  wide: 'aspect-[21/9]',
  auto: 'aspect-auto',
}[props.aspectRatio];

const rootClasses = computed(() => [
  'relative overflow-hidden bg-black transition-all duration-300 rounded-lg',
  aspectRatioClass,
  isLoading.value && shouldLoad.value && 'animate-pulse',
  hasError.value && 'bg-red-900/50',
]);
</script>

<template>
  <div
    ref="containerRef"
    :class="rootClasses"
    @mouseenter="showControls = true"
    @mouseleave="showControls = false"
  >
    <video
      v-if="shouldLoad"
      ref="videoRef"
      class="w-full object-cover"
      :poster="poster"
      :muted="muted"
      :loop="loop"
      preload="metadata"
      playsinline
      @loadeddata="handleLoadedData"
      @error="handleError"
    >
      <source :src="src" type="video/mp4" />
      <p>Your browser doesn't support video playback.</p>
    </video>

    <!-- Custom Controls -->
    <div
      v-if="!hasError && shouldLoad && showControls"
      class="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 cursor-pointer transition-colors duration-200"
    >
      <div class="flex items-center gap-4">
        <button
          class="p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
          @click="togglePlay"
        >
          <UIcon
            :name="playing ? 'i-lucide-pause' : 'i-lucide-play'"
            class="size-8 text-white"
          />
        </button>
        <button
          class="p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
          @click="toggleMute"
        >
          <UIcon
            :name="muted ? 'i-lucide-volume-x' : 'i-lucide-volume-2'"
            class="size-6 text-white"
          />
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading && shouldLoad"
      class="absolute inset-0 flex items-center justify-center"
    >
      <UIcon name="i-lucide-loader" class="size-8 animate-spin text-white" />
    </div>

    <!-- Error State -->
    <div
      v-if="hasError"
      class="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white"
    >
      <UIcon name="i-lucide-video-off" class="size-12 mb-2" />
      <p class="text-sm mb-3">Failed to load video</p>
      <p class="text-xs opacity-75">{{ src }}</p>
    </div>

    <!-- Not Loaded Yet -->
    <div
      v-if="!shouldLoad"
      class="absolute inset-0 flex items-center justify-center"
    >
      <UIcon name="i-lucide-video" class="size-8 text-white" />
    </div>

    <!-- Buffering State -->
    <div
      v-if="waiting && !hasError && !isLoading"
      class="absolute inset-0 flex items-center justify-center"
    >
      <UIcon name="i-lucide-loader" class="size-6 animate-spin text-white" />
    </div>
  </div>
</template>
