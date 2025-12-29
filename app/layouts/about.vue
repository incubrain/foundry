<script setup lang="ts">
const route = useRoute();

// 🎯 SEO: Founder-specific meta
const { getFounder } = useContentCache();
const { data: founder } = await getFounder();

useHead({
  title: founder.value
    ? `${founder.value.given_name} ${founder.value.surname} - ${founder.value.role}`
    : 'About',
  meta: founder.value
    ? [{ name: 'description', content: founder.value.bio }]
    : [],
});

// 🎯 TRACKING: About page view
const { trackEvent } = useEvents();
onMounted(() => {
  trackEvent({
    id: 'about_page_view',
    type: 'element_viewed',
    action: 'page_view',
    location: 'about-page',
    target: route.path,
  });
});
</script>

<template>
  <div class="min-h-screen bg-default text-default antialiased">
    <NavBanner />
    <NavHeader />

    <main class="pb-12 lg:pb-16">
      <div class="py-8 sm:py-12 lg:py-16">
        <UContainer>
          <div class="max-w-3xl mx-auto">
            <!-- Story Content -->
            <article class="prose prose-lg dark:prose-invert max-w-none">
              <slot />
            </article>

            <!-- Conversion CTA -->
            <NavCta
              title="Want to work together?"
              description="We are building a team of A-players who want to help founders succeed."
              orientation="vertical"
              variant="outline"
              class="mt-12"
            >
              <template #links>
                <ConvertInternal
                  offer-slug="mentorship"
                  location="about"
                  variant="button"
                  :spotlight="true"
                  spotlight-color="primary"
                />
              </template>
            </NavCta>
          </div>
        </UContainer>
      </div>
    </main>

    <NavFooter />
  </div>
</template>
