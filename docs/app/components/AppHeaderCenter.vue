<script setup lang="ts">
const route = useRoute();

const links = computed(() => [
  {
    label: 'Policy',
    icon: 'i-lucide-book-open',
    to: '/policy',
    active: route.path.startsWith('/policy'),
  },
  {
    label: 'Sources',
    icon: 'i-lucide-file-pen-line',
    to: '/sources',
    active: route.path.startsWith('/sources'),
  },
]);
</script>

<template>
  <UNavigationMenu :items="links" variant="link" />
</template>
