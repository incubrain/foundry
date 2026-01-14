<script setup lang="ts">
const route = useRoute();
const localePath = useLocalePath()

</script>

<template>
  <UNavigationMenu
    :items="[
      {
        label: 'Research',
        icon: 'i-lucide-flask-conical',
        to: localePath('/research'),
        active: route.path.startsWith('/research'),
      },
      {
        label: 'Policy',
        icon: 'i-lucide-book-open',
        to: localePath('/policy'),
        active: route.path.startsWith('/policy'),
      },
      {
        label: 'Pilots',
        icon: 'i-lucide-sprout',
        to: localePath('/pilots'),
        active: route.path.startsWith('/pilots'),
      },
      {
        label: 'Sources',
        icon: 'i-lucide-file-pen-line',
        to: localePath('/sources'),
        active: route.path.startsWith('/sources'),
      },
    ]"
    variant="link"
  />
</template>
