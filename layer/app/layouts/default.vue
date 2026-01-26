<script setup lang="ts">
const route = useRoute();

const { data: page } = await useAsyncData(
  () => `default${route.path}`,
  () => queryCollection('pages').path(route.path).first(),
  {
    watch: [() => route.path],
  },
);

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
      <slot :page="page" />
    </UPage>
  </UMain>
</template>
