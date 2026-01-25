<script setup lang="ts">
import type { HeaderConfig } from '#navigation';

const route = useRoute();

const headerData = inject<Ref<HeaderConfig>>('navigation_header');

const navigation = computed(() => {
  if (!headerData?.value?.navigation?.length) return [];

  return headerData.value.navigation.map((item) => ({
    ...item,
    active: item.to === route.path,
  }));
});
</script>

<template>
  <UNavigationMenu
    v-if="navigation.length"
    content-orientation="vertical"
    :items="navigation"
    variant="link"
  />
</template>
