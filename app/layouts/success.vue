<script setup lang="ts">
import confetti from 'canvas-confetti';

const route = useRoute();

// 🎯 CONFETTI: Celebration animation
onMounted(() => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
});

// 🎯 TRACKING: Success page view
const { trackEvent } = useEvents();
onMounted(() => {
  trackEvent({
    id: 'success_page_view',
    type: 'element_viewed',
    action: 'page_view',
    location: 'success-page',
    target: route.path,
  });
});
</script>

<template>
  <div
    class="relative min-h-screen flex items-center justify-center bg-linear-to-b from-background to-muted/20"
  >
    <!-- Logo -->
    <div class="absolute top-6 left-0 right-0 z-50 flex justify-center">
      <NuxtLink to="/">
        <Logo />
      </NuxtLink>
    </div>

    <!-- Success card -->
    <div class="max-w-2xl w-full mx-auto px-4">
      <div
        class="bg-card rounded-2xl p-8 shadow-xl border border-success/20 w-full"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
