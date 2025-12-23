<script setup lang="ts">
import confetti from 'canvas-confetti';

const route = useRoute();
const slug = computed(() => route.query.slug as string | undefined);

const { data: page } = await useAsyncData(
  `success-${slug.value || 'index'}`,
  async () => {
    // 1. Try custom offer success page if slug exists
    if (slug.value) {
      const customPage = await queryCollection('pages')
        .path(`/success/${slug.value}`)
        .first();

      if (customPage) return customPage;
    }

    // 2. Fallback to generic success index
    return queryCollection('pages').path('/success').first();
  },
  {
    watch: [slug], // Re-fetch if query param changes
  },
);

// If no page found at all (missing index.md?), show error
if (!page.value && import.meta.server) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Success page not found',
    fatal: true,
  });
}

onMounted(() => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
});

definePageMeta({ layout: false });
</script>

<template>
  <div
    class="relative min-h-screen flex items-center justify-center bg-linear-to-b from-background to-muted/20"
  >
    <div class="absolute top-6 left-0 right-0 z-50 flex justify-center">
      <NuxtLink to="/">
        <Logo />
      </NuxtLink>
    </div>

    <div class="max-w-2xl w-full mx-auto px-4">
      <div
        class="bg-card rounded-2xl p-8 shadow-xl border border-success/20 w-full"
      >
        <ContentRenderer v-if="page" :value="page" />

        <div v-else class="text-center space-y-6">
          <UIcon
            name="i-lucide-check-circle"
            class="w-20 h-20 text-success mx-auto"
          />
          <h1 class="text-3xl font-bold">Success!</h1>
          <p class="text-lg text-toned">Check your email for next steps.</p>
        </div>
      </div>
    </div>
  </div>
</template>
