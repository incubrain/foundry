<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content';

const { data: navigation } = await useAsyncData('navigation', () => {
  return queryCollectionNavigation('docs', ['title', 'label', 'path', 'stem']);
});

const mapNavigation = (
  items: ContentNavigationItem[],
): ContentNavigationItem[] => {
  return items.map((item) => ({
    ...item,
    title: (item as any).label,
    children: item.children ? mapNavigation(item.children) : undefined,
  }));
};

const nav = computed(() =>
  navigation?.value ? mapNavigation(navigation.value) : [],
);

console.log('USING NAV', nav.value);
</script>

<template>
  <div class="space-y-8">
    <UContentNavigation highlight :navigation="nav" />
  </div>
</template>
