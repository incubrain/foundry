```
<script setup lang="ts">
import { useContentPage } from '~/composables/useContentPage';

console.log('[DefaultLayout] Setup', useRoute().path);
const route = useRoute();

const { data: page } = await useAsyncData(
  () => `default${route.path}`,
  () => queryCollection('pages').path(route.path).first(),
  {
    watch: [() => route.path],
  },
);

watch(page, (p) =>
  console.log('[DefaultLayout] Page updated:', p),
);

if (!page.value) {
  // IMPORTANT: clear state before throwing
  console.warn('[DefaultLayout] Page not found (initial), clearing contentPage');
  useContentPage().value = null;

  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true,
  });
}

watchEffect(() => {
  if (page.value?.hasRss) {
    useHead({
      link: [
        {
          rel: 'alternate',
          type: 'application/rss+xml',
          title: `${page.value.title} Feed`,
          href: `/rss${route.path}`,
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
  if (!page.value) return;

  // Prevent stale updates during navigation
  if (page.value.path !== route.path) return;

  contentPage.value = {
    collection: 'pages',
    page: page.value,
    seo: {
      title: page.value.title,
      description: page.value.description,
    },
  };
});

provide(`page${route.path}`, page);
</script>

<template>
  <UMain>
    <UPage>
      <slot />
    </UPage>
  </UMain>
</template>
```
