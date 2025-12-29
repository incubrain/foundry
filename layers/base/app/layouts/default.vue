<script setup lang="ts">
const route = useRoute();

// 🎯 Fetch page data for RSS link support
const { data: page } = await useAsyncData(`layout-page-${route.path}`, () =>
  queryCollection('pages').path(route.path).first(),
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

// 🎯 TRACKING: Generic page view
const { trackEvent } = useEvents();
onMounted(() => {
  const pageName = route.path === '/' ? 'homepage' : route.path.replace('/', '');
  trackEvent({
    id: `${pageName}_view`,
    type: 'element_viewed',
    action: 'page_view',
    location: pageName,
    target: route.path,
  });
});
</script>

<template>
  <div class="min-h-screen bg-default text-default antialiased">
    <NavBanner />
    <NavHeader />

    <main class="pb-12 lg:pb-16">
      <slot />
    </main>

    <NavFooter />
  </div>
</template>