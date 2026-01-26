<script setup lang="ts">
import confetti from 'canvas-confetti';
import { getCollectionName } from '#content-config';

const route = useRoute();
const appConfig = useAppConfig();

// Get business name from site config
const { getSiteConfig } = useContentCache();
const { data: siteConfig } = await getSiteConfig();
const pageTitle = computed(
  () => siteConfig.value?.business?.name || 'Welcome',
);

// Get collection and success path from app config
const pagesConfig = appConfig.content?.collections?.pages;
const pageCollection = computed(() => getCollectionName(pagesConfig, 'pages'));
const successPath = computed(
  () => appConfig.content?.routing?.success || '/success',
);

// 🎯 DETECT: Success page vs Offer page
const isSuccessPage = computed(() => route.path.includes(successPath.value));

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

// ✅ Watch route for page data
const { data: page } = await useAsyncData(
  () => `conversion${route.path}`,
  () => queryCollection(pageCollection.value).path(route.path).first(),
  {
    watch: [() => route.path],
  },
);

// ✅ Make SEO reactive to page changes
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

// 🎯 OG IMAGE: Generate for offer pages only (not success)
// Note: OG image generation happens once, not reactive
watch(
  () => page.value,
  async (newPage) => {
    if (newPage && !isSuccessPage.value) {
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
          <NuxtLink to="/"><AppLogo :title="pageTitle" /></NuxtLink>
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
