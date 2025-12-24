<script setup lang="ts">
import { useShare } from '@vueuse/core';

const { getFounder, getAllOffers } = useContentCache();
const { data: founder } = await getFounder();
const { data: offers } = await getAllOffers();

// 🎯 Use VueUse share composable
const shareOptions = computed(() => ({
  title: `Connect with ${founder.value?.given_name}`,
  text: `Check out my offers`,
  url: window.location.href,
}));

const { share, isSupported: isShareSupported } = useShare(shareOptions);

// Web Share with fallback
const shareProfile = async () => {
  if (!founder.value) return;

  if (isShareSupported.value) {
    try {
      await share();
    } catch (err) {
      // User cancelled or share failed
      console.error('Share failed:', err);
    }
  } else {
    // Fallback: Copy to clipboard
    const { copy } = useClipboard({ source: window.location.href });
    await copy();

    // Optional: Show toast
    const toast = useToast();
    toast.add({
      title: 'Link copied',
      description: 'Share link copied to clipboard',
      color: 'success',
    });
  }
};

definePageMeta({ layout: false });

// SEO
useHead({
  title: 'Work With Us',
  meta: [
    {
      name: 'description',
      content: 'Explore our offers and ways to work together.',
    },
  ],
});
</script>

<template>
  <div class="min-h-screen py-8 sm:py-12 lg:py-16 relative">
    <div class="absolute inset-0 pointer-events-none h-full">
      <div
        class="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-primary/5 to-transparent"
      />
      <div
        class="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"
      />
    </div>
    <UContainer>
      <div class="max-w-2xl mx-auto space-y-8">
        <div class="flex justify-center pointer-events-none">
          <div class="pointer-events-auto">
            <NuxtLink to="/"><Logo /></NuxtLink>
          </div>
        </div>
        <!-- Founder Profile Section -->
        <div
          class="flex flex-col items-center gap-4 py-8 border-b border-default"
        >
          <!-- Avatar with glow -->
          <div class="relative group">
            <div
              class="absolute inset-0 bg-linear-to-t from-primary/20 to-transparent blur-xl group-hover:blur-2xl transition-all duration-300"
            />
            <NuxtImg
              v-if="founder?.avatar"
              :src="founder.avatar.src"
              :alt="founder.avatar.alt"
              class="relative z-10 w-24 h-24 sm:w-32 sm:h-32 rounded-full ring-4 ring-primary/20 object-cover object-top"
            />
          </div>

          <!-- Name & Role -->
          <div class="text-center space-y-1">
            <h1 class="text-2xl sm:text-3xl font-bold text-highlighted">
              {{ founder?.given_name }} {{ founder?.surname }}
            </h1>
            <p class="text-base font-medium text-muted">
              {{ founder?.role }}
            </p>
          </div>

          <!-- Social Links -->
          <ConvertSocial location="offers-hero" />

          <!-- Bio -->
          <p
            class="text-sm text-center text-muted leading-relaxed max-w-md px-4"
          >
            {{ founder?.bio }}
          </p>
        </div>

        <!-- Offers Section -->
        <div class="space-y-4">
          <h2 class="text-xl font-bold text-center text-highlighted mb-6">
            Ways to Work Together
          </h2>

          <!-- Offer Cards -->
          <ConvertFunnel
            v-for="offer in offers"
            :key="offer.stem"
            :offer-slug="offer.stem.replace('offers/', '')"
            location="offers_page"
            variant="card"
            card-variant="subtle"
            color="secondary"
            :spotlight="true"
          />
        </div>

        <!-- Share Action -->
        <div class="flex justify-center pt-4">
          <UButton
            label="Share Profile"
            icon="i-heroicons-share"
            size="lg"
            variant="outline"
            color="neutral"
            @click="shareProfile"
          />
        </div>

        <!-- Link to Story -->
        <div class="text-center pt-4">
          <UButton
            to="/founder"
            label="Read My Story"
            variant="link"
            color="neutral"
            trailing-icon="i-lucide-arrow-right"
          />
        </div>
      </div>
    </UContainer>
  </div>
</template>
