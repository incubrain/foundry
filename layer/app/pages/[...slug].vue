<script setup lang="ts">
// Use unified content page composable - layout already fetched data
const { context } = useContentPage()
</script>

<template>
  <div>
    <ContentRenderer
      v-if="context?.page"
      :key="context.page.path"
      :value="context.page"
    />
  </div>
</template>
