<!-- layouts/docs.vue -->
<script setup lang="ts">
import type { PageCollections, ContentNavigationItem } from '@nuxt/content';
// Static data
const appConfig = useAppConfig();
const collection = (appConfig.content?.collections?.docs ||
  'docs') as keyof PageCollections;
const route = useRoute();

// 📚 DOCS NAVIGATION (for sidebar/components)
const { data: docsNavigation } = await useAsyncData(
  'navigation_docs',
  () => queryCollectionNavigation(collection),
  {
    transform: (data: ContentNavigationItem[]) => {
      const rootResult =
        data.find((item) => item.path === `${collection}`)?.children ||
        data ||
        [];
      return rootResult;
    },
  },
);

const { data: page } = await useAsyncData(
  () => `docs${route.path}`,
  () => queryCollection(collection).path(route.path).first(),
  {
    watch: [() => route.path],
  },
);

if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true,
  });
}

// Fetch surround
const { data: surround } = await useAsyncData(
  () => `surround-${route.path}`,
  () =>
    queryCollectionItemSurroundings(collection, route.path, {
      fields: ['description'],
    }),
  {
    watch: [() => route.path],
  },
);

// SEO meta
const title = page.value.seo?.title || page.value.title;
const description = page.value.seo?.description || page.value.description;

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description,
});

const github = appConfig.github;
const editLink = github
  ? [
      github.url,
      'edit',
      github.branch,
      github.rootDir,
      'content',
      `${route.path}`,
    ]
      .filter(Boolean)
      .join('/')
  : null;

provide('navigation_docs', docsNavigation);
</script>

<template>
  <UMain>
    <UContainer>
      <UPage v-if="page">
        <!-- LEFT: Static navigation -->
        <template #left>
          <UPageAside>
            <DocsAsideLeftTop />
            <DocsAsideLeftBody />
          </UPageAside>
        </template>

        <!-- MAIN: ALL CONTENT RENDERED HERE -->
        <UPageHeader
          :title="page.title"
          :description="page.description"
          :ui="{ wrapper: 'flex-row items-center flex-wrap justify-between' }"
        >
          <template #links>
            <UButton
              v-for="(link, index) in page.links"
              :key="index"
              size="sm"
              v-bind="link"
            />
            <DocsPageHeaderLinks />
          </template>
        </UPageHeader>

        <UPageBody>
          <slot :page />

          <USeparator>
            <div
              v-if="github"
              class="flex items-center gap-2 text-sm text-muted"
            >
              <UButton
                variant="link"
                color="neutral"
                :to="editLink!"
                target="_blank"
                icon="i-lucide-pen"
              >
                Edit
              </UButton>
              <span>or</span>
              <UButton
                variant="link"
                color="neutral"
                :to="`${github.url}/issues/new/choose`"
                target="_blank"
                icon="i-lucide-alert-circle"
              >
                Report
              </UButton>
            </div>
          </USeparator>

          <UContentSurround :surround="surround" />
          <Bibliography />
        </UPageBody>

        <!-- RIGHT: Dynamic TOC -->
        <template v-if="page?.body?.toc?.links?.length" #right>
          <UContentToc
            highlight
            :title="appConfig.toc?.title || 'Table of Contents'"
            :links="page.body.toc.links"
          >
            <template #bottom>
              <DocsAsideRightBottom />
            </template>
          </UContentToc>
        </template>
      </UPage>
    </UContainer>
  </UMain>
</template>
