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
      root: 'bg-muted',
      container: 'lg:py-16',
      bottom: 'bg-default',
    }"
  >
    <template #top>
      <AppFooterTop />
    </template>

    <template #left>
      <AppFooterLeft />
    </template>


    <template #right>
      <AppFooterRight />
    </template>

    <template #bottom>
      <AppFooterBottom />
    </template>
  </UFooter>
</template>
