<script setup lang="ts">
import { useContentPage } from '~/composables/useContentPage';
import type { PageCollections, ContentNavigationItem } from '@nuxt/content';

console.log('[DocsLayout] Setup', useRoute().path);
// Static data
const appConfig = useAppConfig();
const { collections } = useContentConfig();
const collection = collections.docs as keyof PageCollections;
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

watch(page, (p) =>
  console.log('[DocsLayout] Page updated:', p?.title, p?.path),
);

if (!page.value) {
  console.log('[DocsLayout] Page not found (initial), clearing contentPage');
  // IMPORTANT: clear state before throwing
  useContentPage().value = null;

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

useHead({
  link: [
    {
      rel: 'stylesheet',
      href: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
      integrity: 'sha384-n8MVd4RsNI8uYk8U+...snip...',
      crossorigin: 'anonymous',
    },
  ],
});

const contentReady = ref(false);

watch(
  () => page.value,
  async (newPage) => {
    // Reset immediately on any page change
    contentReady.value = false;

    if (newPage) {
      // Wait for template to update with new page data
      await nextTick();
      // Extra tick for ContentRenderer and Cited components to mount
      await nextTick();
      // Now citations are populated, safe to show Bibliography/Surround
      console.log('content loaded', contentReady.value);
      contentReady.value = true;
    }
  },
  { immediate: true },
);

/* -------------------------------------------------------------------------- */
/*                           PUBLISH PAGE CONTEXT                              */
/* -------------------------------------------------------------------------- */

const contentPage = useContentPage();

watchEffect(() => {
  if (!page.value) return;

  // Prevent stale updates during navigation
  if (page.value.path !== route.path) return;

  contentPage.value = {
    collection: 'docs',
    page: page.value,
    navigation: docsNavigation.value,
    surround: surround.value,
    seo: {
      title: page.value.seo?.title || page.value.title,
      description: page.value.seo?.description || page.value.description,
    },
    meta: {
      editPath: route.path,
    },
  };
});
</script>

<template>
  <UMain>
    <UContainer>
      <UPage v-if="page" :key="route.path">
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
          <div>
            <slot />
          </div>

          <template v-if="contentReady">
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

            <UContentSurround
              :surround="surround"
              :key="`surround-${route.path}`"
            />
            <Bibliography :key="`bibliography-${route.path}`" />
          </template>
        </UPageBody>

        <!-- RIGHT: Dynamic TOC -->
        <template v-if="page?.body?.toc?.links?.length" #right>
          <UContentToc
            highlight
            :title="appConfig.toc?.title || 'Table of Contents'"
            :links="page.body.toc.links"
            :key="`toc-${route.path}`"
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
