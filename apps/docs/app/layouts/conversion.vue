<script setup lang="ts">
import confetti from 'canvas-confetti';

const route = useRoute();
const slug = route.path.split('/').pop();

const PAGE_TITLE = 'Founder Funnel';
const PAGE_COLLECTION = 'landing';

// 🎯 DETECT: Success page vs Offer page
const isSuccessPage = computed(() => route.path.includes('/success'));

// 🎯 CONFETTI: Auto-trigger for success pages
onMounted(() => {
  if (isSuccessPage.value) {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }
});

// 🎯 SEO: Inject meta tags
const { data: page } = await useAsyncData(`offer-${slug}`, () =>
  queryCollection(PAGE_COLLECTION).path(route.path).first(),
);

useSeoMeta({
  title: () => page.value?.title,
  description: page.value?.description,
  ogTitle: () => page.value?.title,
  ogDescription: page.value?.description,
});

// 🎯 OG IMAGE: Generate for offer pages only (not success)
if (!isSuccessPage.value) {
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
}
</script>

<template>
  <UMain>
    <div
      :class="[
        'relative min-h-screen flex flex-col items-center justify-center',
        isSuccessPage
          ? 'bg-linear-to-b from-background to-muted/20'
          : 'overflow-hidden py-16 sm:py-20 lg:py-24',
      ]"
    >
      <!-- Background decoration (offer pages only) -->
      <div v-if="!isSuccessPage" class="absolute inset-0 pointer-events-none">
        <div
          class="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-primary/5 to-transparent"
        />
        <div
          class="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"
        />
      </div>

      <!-- Logo -->
      <div
        :class="[
          'flex justify-center w-full',
          isSuccessPage ? 'z-50' : 'z-50 pointer-events-none',
        ]"
      >
        <div :class="{ 'pointer-events-auto': !isSuccessPage }">
          <NuxtLink to="/"><AppLogo :title="PAGE_TITLE" /></NuxtLink>
        </div>
      </div>

      <!-- Content wrapper: conditional based on page type -->
      <UContainer v-if="!isSuccessPage" class="relative z-10">
        <div class="max-w-3xl mx-auto">
          <UPageHero :title="page?.title" :description="page?.description" />
          <slot :page="page" />
        </div>
      </UContainer>

      <!-- Success card wrapper -->
      <div v-else class="max-w-2xl w-full mx-auto px-4">
        <div
          class="bg-card rounded-2xl p-8 shadow-xl border border-success/20 w-full"
        >
          <ContentRenderer v-if="page" :value="page" />
          <slot />
        </div>
      </div>
    </div>
  </UMain>
</template>
