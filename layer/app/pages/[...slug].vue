<script setup lang="ts">
// TODO: link to $attrs docs
</script>

<template>
  <div>
    <ContentRenderer v-if="$attrs.page" :value="$attrs.page" />
  </div>
</template>
