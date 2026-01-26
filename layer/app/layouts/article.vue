<script setup lang="ts">
import {
  getCollectionName,
  getCollectionPrefix,
  getCollectionBackLabel,
} from '#content-config';

const route = useRoute();
const appConfig = useAppConfig();

// Get collection and routing config from pages collection
const pagesConfig = appConfig.content?.collections?.pages;
const pagesCollection = computed(() => getCollectionName(pagesConfig, 'pages'));
const articlesBasePath = computed(() =>
  getCollectionPrefix(pagesConfig, '/articles'),
);
const articlesBackLabel = computed(() =>
  getCollectionBackLabel(pagesConfig, 'Back to Articles'),
);

// ✅ Watch route for article data
const { data: article } = await useAsyncData(
  () => `article${route.path}`,
  () => queryCollection(pagesCollection.value).path(route.path).first(),
  {
    watch: [() => route.path],
  },
);

// ✅ Watch route for surround data
const { data: surround } = await useAsyncData(
  () => `article-surround${route.path}`,
  () =>
    queryCollectionItemSurroundings(pagesCollection.value, route.path, {
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
</script>

<template>
  <UMain>
    <UPage>
      <UPageHeader>
        <template #headline>
          <UButton
            :to="articlesBasePath"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            size="sm"
            :label="articlesBackLabel"
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
