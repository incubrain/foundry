<script setup lang="ts">
const route = useRoute();

// Use unified content page composable
const { getPage, setContext } = useContentPage();

// Fetch page data
const { data: page } = await getPage();

if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true,
  });
}

// Publish context for components
watchEffect(() => {
  if (!page.value || page.value.path !== route.path) return;
  setContext(page.value);
});

// RSS feed link
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
</script>

<template>
  <UMain>
    <UPage>
      <slot />
    </UPage>
  </UMain>
</template>
