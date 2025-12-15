<script setup lang="ts">
import { useIntersectionObserver, useMediaControls } from '@vueuse/core';

export interface VideoProps {
  src: string;
  alt?: string;
  poster?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'wide' | 'auto';
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  loading?: 'eager' | 'lazy';
}

const props = withDefaults(defineProps<VideoProps>(), {
  aspectRatio: 'video',
  alt: 'video',
  autoplay: false,
  muted: true,
  loop: false,
  controls: false,
  loading: 'lazy',
  poster: undefined,
});

// Detect external video sources
const isExternalVideo = computed(() => {
  const src = props.src.toLowerCase();
  return (
    src.includes('youtube.com') ||
    src.includes('youtu.be') ||
    src.includes('vimeo.com') ||
    src.startsWith('http://') ||
    src.startsWith('https://')
  );
});

// Refs
const containerRef = ref<HTMLElement>();
const videoRef = ref<HTMLVideoElement>();

// State (only for self-hosted videos)
const isLoading = ref(true);
const hasError = ref(false);
const shouldLoad = ref(props.loading === 'eager');
const showControls = ref(false);

// VueUse Media Controls (only for self-hosted videos)
const { playing, waiting, muted } = useMediaControls(videoRef, {
  src: computed(() =>
    shouldLoad.value && !isExternalVideo.value ? props.src : '',
  ),
});

// Intersection Observer for lazy loading
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

// Event handlers (self-hosted only)
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

// Autoplay logic (self-hosted only) - simple muted autoplay
watchEffect(() => {
  if (
    videoRef.value &&
    props.autoplay &&
    props.muted &&
    shouldLoad.value &&
    !hasError.value &&
    !isExternalVideo.value
  ) {
    playing.value = true;
  }
});

// Set initial muted state (self-hosted only)
watchEffect(() => {
  if (videoRef.value && !isExternalVideo.value) {
    muted.value = props.muted;
  }
});

// Show/hide controls on hover (self-hosted only)
const handleMouseEnter = () => {
  if (!isExternalVideo.value) {
    showControls.value = true;
  }
};

const handleMouseLeave = () => {
  if (!isExternalVideo.value) {
    showControls.value = false;
  }
};

const rootClass = computed(() => {
  const classes = [
    'relative',
    'overflow-hidden',
    'bg-black',
    'transition-all',
    'duration-300',
  ];

  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    wide: 'aspect-[21/9]',
    auto: 'aspect-auto',
  };

  classes.push(aspectRatioClasses[props.aspectRatio]);

  if (isLoading.value && shouldLoad.value && !isExternalVideo.value) {
    classes.push('animate-pulse');
  }

  if (hasError.value && !isExternalVideo.value) {
    classes.push('bg-red-900/50');
  }

  return classes.join(' ');
});

const videoClass = 'w-full object-cover';
const overlayClass = 'absolute inset-0 flex items-center justify-center';
const controlsClass =
  'absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 cursor-pointer transition-colors duration-200';
const loadingStateClass = 'flex items-center justify-center text-white';
const errorStateClass =
  'flex flex-col items-center justify-center text-center p-6 text-white';
</script>

<template>
  <div
    ref="containerRef"
    :class="rootClass"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div
      v-if="isExternalVideo && shouldLoad"
      class="relative w-full aspect-video"
    >
      <iframe
        :src="src"
        :title="alt"
        class="absolute inset-0 w-full h-full"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      />
    </div>

    <video
      v-else-if="shouldLoad && !isExternalVideo"
      ref="videoRef"
      :class="videoClass"
      :poster="poster"
      :muted="muted"
      :loop="loop"
      :controls="controls"
      preload="metadata"
      playsinline
      @loadeddata="handleLoadedData"
      @error="handleError"
    >
      <source :src="src" type="video/mp4" >
      <p>Your browser doesn't support video playback.</p>
    </video>

    <div
      v-if="
        !isExternalVideo && !controls && !hasError && shouldLoad && showControls
      "
      :class="controlsClass"
      class="opacity-100 transition-opacity duration-200"
    >
      <div class="flex items-center gap-4">
        <button
          class="p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors flex cursor-pointer"
          @click="togglePlay"
        >
          <UIcon
            :name="playing ? 'i-lucide-pause' : 'i-lucide-play'"
            class="size-8 text-white"
          />
        </button>

        <button
          class="p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors flex cursor-pointer"
          @click="toggleMute"
        >
          <UIcon
            :name="muted ? 'i-lucide-volume-x' : 'i-lucide-volume-2'"
            class="size-6 text-white"
          />
        </button>
      </div>
    </div>

    <div
      v-if="!isExternalVideo && isLoading && shouldLoad"
      :class="overlayClass"
    >
      <div :class="loadingStateClass">
        <UIcon name="i-lucide-loader" class="size-8 animate-spin text-white" />
      </div>
    </div>

    <div v-if="!isExternalVideo && hasError" :class="overlayClass">
      <div :class="errorStateClass">
        <UIcon name="i-lucide-video-off" class="size-12 mb-2" />
        <p class="text-sm mb-3">Failed to load video</p>
        <p class="text-xs opacity-75">{{ src }}</p>
      </div>
    </div>

    <div v-if="!shouldLoad" :class="overlayClass">
      <div :class="loadingStateClass">
        <UIcon name="i-lucide-video" class="size-8 text-white" />
      </div>
    </div>

    <div
      v-if="!isExternalVideo && waiting && !hasError && !isLoading"
      :class="overlayClass"
    >
      <div :class="loadingStateClass">
        <UIcon name="i-lucide-loader" class="size-6 animate-spin text-white" />
      </div>
    </div>
  </div>
</template>
