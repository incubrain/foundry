<script setup lang="ts">
const route = useRoute();
const { data: page } = await useAsyncData(route.path, () =>
  queryCollection('pages').path(route.path).first(),
);

const { trackEvent } = useEvents();

onMounted(() => {
  trackEvent({
    type: 'element_viewed',
    action: 'page_view',
    location: 'homepage',
  });
});
</script>

<template>
  <UPageBody class="mt-0 p-0">
    <ContentRenderer v-if="page" :value="page" />
  </UPageBody>
</template>
