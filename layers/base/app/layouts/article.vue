<!-- layers/base/app/layouts/article.vue -->
<script setup lang="ts">
const route = useRoute();

const { data: article } = await useAsyncData(`article-${route.path}`, () =>
  queryCollection('pages').path(route.path).first(),
);

// Fetch surround data
const { data: surround } = await useAsyncData(
  `article-${route.path}-surround`,
  () =>
    queryCollectionItemSurroundings('pages', route.path, {
      fields: ['title', 'description', 'label'],
    }),
);

useHead({
  title: article.value?.title,
  meta: [
    {
      name: 'description',
      content: article.value?.description,
    },
  ],
});
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader>
        <template #headline>
          <UButton
            to="/decisions"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            size="sm"
            label="Back to Decisions"
          />
        </template>

        <template #title>
          {{ article?.title }}
        </template>

        <template #description>
          <div class="flex flex-wrap items-center gap-4 mb-4">
            <div
              v-if="article?.label"
              class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20"
            >
              <UIcon name="i-lucide-tag" class="size-4 text-primary" />
              <span class="font-mono font-semibold text-primary text-sm">
                {{ article.label }}
              </span>
            </div>

            <div
              v-if="article?.date"
              class="flex items-center gap-2 text-muted"
            >
              <UIcon name="i-lucide-calendar" class="size-4" />
              <NuxtTime
                :datetime="article.date"
                year="numeric"
                month="long"
                day="numeric"
                class="text-sm font-medium"
              />
            </div>
          </div>

          <p
            v-if="article?.description"
            class="text-lg text-muted leading-relaxed"
          >
            {{ article.description }}
          </p>
        </template>

        <template v-if="article?.image" #default>
          <NuxtImg
            :src="article.image"
            :alt="article.title"
            class="w-full rounded-lg border border-default shadow-lg mt-8"
            loading="lazy"
          />
        </template>
      </UPageHeader>

      <UPageBody class="max-w-3xl mx-auto">
        <article class="prose prose-lg max-w-none">
          <slot />
        </article>

        <template v-if="surround?.filter(Boolean).length">
          <USeparator class="my-12" />
          <UContentSurround :surround="surround" />
        </template>

        <div class="mt-12 pt-8 border-t">
          <ConvertInternal
            offer-slug="mentorship"
            location="article-footer"
            variant="card"
            button-variant="solid"
            color="primary"
            size="lg"
            block
          />
        </div>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
