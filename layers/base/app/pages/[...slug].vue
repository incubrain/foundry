<script setup lang="ts">
// Query content based on URL path
const route = useRoute();

const { data: page } = await useAsyncData(`page-${route.path}`, () =>
  queryCollection('pages').path(route.path).first(),
);

// Handle 404
if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: `Page not found: ${route.path}`,
    fatal: true,
  });
}
</script>

<template>
  <ContentRenderer v-if="page" :value="page" />
</template>
