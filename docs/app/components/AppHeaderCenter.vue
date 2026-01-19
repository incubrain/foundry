<script setup lang="ts">
const route = useRoute();
</script>

<template>
  <UNavigationMenu
    content-orientation="vertical"
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
        label: 'Resources',
        icon: 'i-lucide-book-key',
        active: route.path.startsWith('/resources'),
        children: [
          {
            label: 'Sources',
            icon: 'i-lucide-file-pen-line',
            to: '/resources/sources',
          },
          {
            label: 'Glossary',
            icon: 'i-lucide-library',
            to: '/resources/glossary',
          },
        ],
      },
    ]"
    variant="link"
  />
</template>
