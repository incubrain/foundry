<script setup lang="ts">
const route = useRoute();
const slug = route.path.split('/').pop(); // Extract slug from path

// 🎯 TRACKING: Page view event
const { trackEvent } = useEvents();
onMounted(() => {
  trackEvent({
    id: `offer_${slug}_view`,
    type: 'element_viewed',
    action: 'page_view',
    location: `offer-page-${slug}`,
    target: route.path,
  });
});

// 🎯 SEO: Inject meta tags (page content available in slot)
const { data: page } = await useAsyncData(`offer-${slug}`, () =>
  queryCollection('pages').path(route.path).first(),
);

useSeoMeta({
  title: () => page.value?.title,
  description: page.value?.description,
  ogTitle: () => page.value?.title,
  ogDescription: page.value?.description,
});

// 🎯 OG IMAGE: Generate social preview
const { getSiteConfig } = useContentCache();
const { data: config } = await getSiteConfig();

defineOgImage({
  component: 'Frame',
  props: {
    title: page.value?.title,
    description: page.value?.description,
    image: config.value?.business?.logo,
  },
});
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center relative overflow-hidden py-16 sm:py-20 lg:py-24"
  >
    <!-- Background decoration -->
    <div class="absolute inset-0 pointer-events-none">
      <div
        class="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-primary/5 to-transparent"
      />
      <div
        class="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"
      />
    </div>

    <!-- Logo in top center -->
    <div
      class="absolute top-6 left-0 right-0 z-50 flex justify-center pointer-events-none"
    >
      <div class="pointer-events-auto">
        <NuxtLink to="/"><Logo /></NuxtLink>
      </div>
    </div>

    <!-- Content from catchall page -->
    <UContainer class="relative z-10">
      <div class="max-w-3xl mx-auto">
        <slot />
      </div>
    </UContainer>
  </div>
</template>
