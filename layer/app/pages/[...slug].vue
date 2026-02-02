<script setup lang="ts">
import { useContentPage } from '~/composables/useContentPage';

const contentPage = useContentPage();

watch(
  contentPage,
  (v) => {
    console.log('[SlugPage] contentPage updated:', v?.page?.path);
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <div>
    <ContentRenderer
      v-if="contentPage?.page"
      :value="contentPage.page"
      :key="contentPage.page.path"
    />
  </div>
</template>
