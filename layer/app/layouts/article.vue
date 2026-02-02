<script setup lang="ts">
import { useContentPage } from '~/composables/useContentPage';

const route = useRoute();
const { collections, routing } = useContentConfig();

// ✅ Watch route for article data
const { data: article } = await useAsyncData(
  () => `article${route.path}`,
  () => queryCollection(collections.pages).path(route.path).first(),
  {
    watch: [() => route.path],
  },
);

if (!article.value) {
  // IMPORTANT: clear state before throwing
  useContentPage().value = null;

  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true,
  });
}

// ✅ Watch route for surround data
const { data: surround } = await useAsyncData(
  () => `article-surround${route.path}`,
  () =>
    queryCollectionItemSurroundings(collections.pages, route.path, {
      fields: ['title', 'description', 'label'],
    }),
  {
    watch: [() => route.path],
  },
);

// ✅ Make head reactive to article changes
watchEffect(() => {
  if (article.value) {
    useHead({
      title: article.value.title,
      meta: [
        {
          name: 'description',
          content: article.value.description,
        },
      ],
    });
  }
});

/* -------------------------------------------------------------------------- */
/*                           PUBLISH PAGE CONTEXT                              */
/* -------------------------------------------------------------------------- */

const contentPage = useContentPage();

watchEffect(() => {
  if (!article.value) return;

  // Prevent stale updates during navigation
  if (article.value.path !== route.path) return;

  contentPage.value = {
    collection: 'pages',
    page: article.value,
    surround: surround.value,
    seo: {
      title: article.value.title,
      description: article.value.description,
    },
  };
});

provide(`page${route.path}`, article);
</script>

<template>
  <UMain>
    <UPage>
      <UPageHeader>
        <template #headline>
          <UButton
            :to="routing.pagesPrefix"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            size="sm"
            :label="routing.pagesBackLabel"
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
              v-if="article?.publishedAt"
              class="flex items-center gap-2 text-muted"
            >
              <UIcon name="i-lucide-calendar" class="size-4" />
              <NuxtTime
                :datetime="article.publishedAt"
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
      </UPageBody>
    </UPage>
  </UMain>
</template>
