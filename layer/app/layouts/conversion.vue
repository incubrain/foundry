<script setup lang="ts">
const route = useRoute();
const { collections } = useContentConfig();

// Get business name from site config
const { getSiteConfig } = useContentCache();
const { data: siteConfig } = await getSiteConfig();
const pageTitle = computed(
  () => siteConfig.value?.business?.name || 'Welcome',
);

// Watch route for page data
const { data: page } = await useAsyncData(
  () => `conversion${route.path}`,
  () => queryCollection(collections.pages).path(route.path).first(),
  {
    watch: [() => route.path],
  },
);

// Make SEO reactive to page changes
watchEffect(() => {
  if (page.value) {
    useSeoMeta({
      title: page.value.title,
      description: page.value.description,
      ogTitle: page.value.title,
      ogDescription: page.value.description,
    });
  }
});

// OG Image generation
watch(
  () => page.value,
  async (newPage) => {
    if (newPage) {
      const { getSiteConfig } = useContentCache();
      const { data: config } = await getSiteConfig();

      defineOgImage({
        component: 'Frame',
        props: {
          title: newPage.title,
          description: newPage.description,
          image: config.value?.business?.logo,
        },
      });
    }
  },
  { immediate: true },
);
</script>

<template>
  <UMain>
    <div
      class="relative min-h-screen flex flex-col items-center justify-center overflow-hidden py-16 sm:py-20 lg:py-24"
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

      <!-- Logo -->
      <div class="flex justify-center w-full z-50 pointer-events-none">
        <div class="pointer-events-auto">
          <NuxtLink to="/"><AppLogo :title="pageTitle" /></NuxtLink>
        </div>
      </div>

      <!-- Content wrapper -->
      <UContainer class="relative z-10">
        <div class="max-w-3xl mx-auto">
          <UPageHero :title="page?.title" :description="page?.description" />
          <slot :page="page" />
        </div>
      </UContainer>
    </div>
  </UMain>
</template>
