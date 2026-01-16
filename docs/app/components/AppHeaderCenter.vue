<script setup lang="ts">
const route = useRoute();
</script>

<template>
  <UNavigationMenu
    :items="[
      {
        label: 'Research',
        icon: 'i-lucide-flask-conical',
        to: '/research',
        active: route.path.startsWith('/research'),
      },
      {
        label: 'Policy',
        icon: 'i-lucide-book-open',
        to: '/policy',
        active: route.path.startsWith('/policy'),
      },
      {
        label: 'Pilots',
        icon: 'i-lucide-sprout',
        to: '/pilots',
        active: route.path.startsWith('/pilots'),
      },
      {
        label: 'Sources',
        icon: 'i-lucide-file-pen-line',
        to: '/sources',
        active: route.path.startsWith('/sources'),
      },
      {
        label: 'Glossary',
        icon: 'i-lucide-library',
        to: '/glossary',
        active: route.path.startsWith('/glossary'),
      },
    ]"
    variant="link"
  />
</template>
