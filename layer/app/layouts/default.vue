<script setup lang="ts">
const route = useRoute();

// 🎯 Fetch page data for RSS link support
const { data: page } = await useAsyncData(`page-${route.path}`, () =>
  queryCollection('landing').path(route.path).first(),
);

// 🎯 SEO: Add RSS link if page has rssLink frontmatter
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
</script>

<template>
  <UMain>
    <UPage>
      <slot :page="page" />
    </UPage>
  </UMain>
</template>
