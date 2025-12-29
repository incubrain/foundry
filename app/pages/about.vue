<script setup lang="ts">
// Fetch founder data
const { getFounder } = useContentCache();
const { data: founder } = await getFounder();

// Fetch story content
const { data: story } = await useAsyncData('about-story', () =>
  queryCollection('pages').path('/about').first(),
);

// SEO
useHead({
  title: founder.value
    ? `${founder.value.given_name} ${founder.value.surname} - ${founder.value.role}`
    : 'Founder',
  meta: founder.value
    ? [{ name: 'description', content: founder.value.bio }]
    : [],
});
</script>

<template>
  <div class="min-h-screen py-8 sm:py-12 lg:py-16">
    <UContainer>
      <div class="max-w-3xl mx-auto">
        <!-- Story Content -->
        <article
          v-if="story"
          class="prose prose-lg dark:prose-invert max-w-none"
        >
          <h1 class="text-3xl sm:text-4xl font-bold mb-4">
            {{ story.title }}
          </h1>
          <p class="text-xl text-muted mb-8">
            {{ story.description }}
          </p>
          <ContentRenderer :value="story" />
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
</template>
