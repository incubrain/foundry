<script setup lang="ts">
/**
 * AppFooter - Dumb structural component
 *
 * This component provides the footer structure only.
 * All data is injected into child components from app.vue via provide/inject.
 *
 * Children:
 * - AppFooterLeft: Logo/branding
 * - AppFooterCenter: Navigation columns
 * - AppFooterRight: Social links & color mode
 * - AppFooterBottom: Copyright & bottom links
 */
</script>

<template>
  <UFooter
    :ui="{
      bottom: 'bg-muted',
      container: 'lg:py-8',
    }"
  >
    <template #left>
      <AppFooterLeft />
    </template>

    <AppFooterCenter />

    <template #right>
      <AppFooterRight />
    </template>

    <template #bottom>
      <AppFooterBottom />
    </template>
  </UFooter>
</template>