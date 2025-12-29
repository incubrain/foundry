<script setup lang="ts">
const route = useRoute();

// 🎯 TRACKING: Generic page view (for homepage, etc.)
const { trackEvent } = useEvents();
onMounted(() => {
  const pageName =
    route.path === '/' ? 'homepage' : route.path.replace('/', '');
  trackEvent({
    id: `${pageName}_view`,
    type: 'element_viewed',
    action: 'page_view',
    location: pageName,
    target: route.path,
  });
});
</script>

<template>
  <div class="min-h-screen bg-default text-default antialiased">
    <NavBanner />
    <NavHeader />

    <main class="pb-12 lg:pb-16">
      <slot />
    </main>

    <NavFooter />
  </div>
</template>
