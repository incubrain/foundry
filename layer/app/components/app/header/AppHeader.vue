<script setup lang="ts">
/**
 * AppHeader - Dumb structural component
 *
 * This component provides the header structure only.
 * All data is injected into child components from app.vue via provide/inject.
 *
 * Children:
 * - AppHeaderCenter: Main navigation menu
 * - AppHeaderCTA: Call-to-action buttons
 * - AppHeaderBody: Mobile navigation drawer
 */

const site = useSiteConfig();
</script>

<template>
  <UHeader :ui="{ center: 'flex-1' }" :to="'/'" :title="site.name">
    <AppHeaderCenter />

    <template #title>
      <AppLogo :title="site.name" class="h-6 w-auto shrink-0" />
    </template>

    <template #right>
      <AppHeaderRight />
    </template>

    <template #toggle="{ open, toggle }">
      <IconMenuToggle :open="open" class="lg:hidden" @click="toggle" />
    </template>

    <template #body>
      <AppHeaderBody />
    </template>
  </UHeader>
</template>
