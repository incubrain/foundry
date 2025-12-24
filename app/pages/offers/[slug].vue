<!-- app/pages/offers/[slug].vue -->
<script setup lang="ts">
const route = useRoute();
const slug = route.params.slug as string;

const { getSiteConfig } = useContentCache();
const { data: configData } = await getSiteConfig();
const business = computed(() => configData.value?.business);

// Fetch offer page
const { data: offer } = await useAsyncData(`offer-page-${slug}`, () =>
  queryCollection('pages').path(`/offers/${slug}`).first(),
);

if (!offer.value) {
  throw createError({
    statusCode: 404,
    statusMessage: `Offer "${slug}" not found`,
    fatal: true,
  });
}

// ✅ CRITICAL: Trigger Schema.org rendering
useHead(offer.value.head || {});

// ✅ Static SEO meta (server-only for performance)
if (import.meta.server) {
  useSeoMeta({
    description: offer.value.description,
    ogDescription: offer.value.description,
    ogImage: offer.value.image,
    twitterCard: 'summary_large_image',
  });
}

// ✅ Reactive title (client + server)
useSeoMeta({
  title: () => offer.value.title,
  ogTitle: () => offer.value.title,
});

definePageMeta({ layout: false });

defineOgImage({
  component: 'Frame',
  props: {
    title: offer.value.title,
    description: offer.value.description,
    image: business.value?.logo,
  },
});
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center relative overflow-hidden py-16 sm:py-20 lg:py-24"
  >
    <div class="absolute inset-0 pointer-events-none">
      <div
        class="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-primary/5 to-transparent"
      />
      <div
        class="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"
      />
    </div>

    <div
      class="absolute top-6 left-0 right-0 z-50 flex justify-center pointer-events-none"
    >
      <div class="pointer-events-auto">
        <NuxtLink to="/"><Logo /></NuxtLink>
      </div>
    </div>

    <UContainer class="relative z-10">
      <div class="max-w-3xl mx-auto">
        <div class="space-y-6 text-center mb-12 lg:mb-16">
          <h1
            class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]"
          >
            {{ offer.title }}
          </h1>

          <p
            class="text-lg sm:text-xl text-muted/80 leading-relaxed max-w-2xl mx-auto"
          >
            {{ offer.description }}
          </p>
        </div>

        <!-- ✅ MDC Content (includes embedded CTAs via ::convert-email) -->
        <div class="mb-12 lg:mb-16 prose prose-invert max-w-none">
          <ContentRenderer :value="offer" />
        </div>
      </div>
    </UContainer>
  </div>
</template>
