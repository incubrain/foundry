<script setup lang="ts">
const siteConfig = useSiteConfig();

useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - ${siteConfig.name}` : siteConfig.name;
  },
  htmlAttrs: { lang: 'en' },
  link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
});

useSeoMeta({
  description: siteConfig.description,
  ogTitle: siteConfig.name,
  ogDescription: siteConfig.description,
  ogImage: `${siteConfig.url}/og-image.png`,
  twitterCard: 'summary_large_image',
});

// Dev shortcuts
const isDev = import.meta.dev;
const eventTrigger = ref<{ open: () => void } | null>(null);
if (isDev && import.meta.client) {
  defineShortcuts({
    meta_shift_r: useDevConfig().clearAllStorage,
    meta_shift_e: () => eventTrigger.value?.open(),
  });
}
</script>

<template>
  <UApp>
    <DevEvents v-if="isDev" ref="eventTrigger" class="hidden lg:block" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<style>
/* Vue Page Transitions */
.page-enter-active,
.page-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition-duration: 0.01ms !important;
  }

  .page-enter-from,
  .page-leave-to {
    transform: none !important;
  }
}
</style>
