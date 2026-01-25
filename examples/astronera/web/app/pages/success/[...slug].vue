<script setup lang="ts">
definePageMeta({ layout: 'conversion', header: false, footer: false });
</script>

<template>
  <ContentRenderer v-if="$attrs.page" :value="$attrs.page" />
</template>
