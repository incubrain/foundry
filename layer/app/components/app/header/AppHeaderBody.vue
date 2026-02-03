<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

// Use the full content navigation for mobile drawer
const navigation = inject<Ref<ContentNavigationItem[]>>('navigation_all')
</script>

<template>
  <UContentNavigation
    highlight
    variant="link"
    :navigation="navigation"
  />
</template>
