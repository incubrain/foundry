<script setup lang="ts">
const site = useSiteConfig()
</script>

<template>
  <NuxtLink
    :to="'/'"
    class="flex"
  >
    <AppLogo :title="site.name" />
  </NuxtLink>
</template>
