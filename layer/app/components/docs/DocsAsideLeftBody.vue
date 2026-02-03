<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const DOCS_COLLECTION = 'docs'

const { data: navigation } = await useAsyncData('docs-navigation', () => {
  return queryCollectionNavigation(DOCS_COLLECTION, ['title', 'label', 'path', 'stem'])
})

const mapNavigation = (
  items: ContentNavigationItem[],
): ContentNavigationItem[] => {
  return items?.map(item => ({
    ...item,
    title: (item as any).label ?? (item as any).title,
    children: item.children?.length ? mapNavigation(item.children) : undefined,
  }))
}

const nav = computed(() => (navigation.value?.length ? mapNavigation(navigation.value[0]?.children || []) : []))
</script>

<template>
  <div
    v-if="nav"
    class="space-y-8"
  >
    <UContentNavigation
      highlight
      :navigation="nav"
    />
  </div>
</template>
