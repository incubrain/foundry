<script setup lang="ts">
const appConfig = useAppConfig();

// ✅ Only include socials that are explicitly configured
const links = computed(() => {
  const socials = appConfig.socials || {};

  return Object.entries(socials).map(([key, url]) => ({
    icon: `i-simple-icons-${key}`,
    to: url,
    target: '_blank',
    'aria-label': `${key} social link`,
  }));
});
</script>

<template>
  <div class="flex items-center gap-2">
    <template v-if="links.length">
      <UButton
        v-for="(link, index) of links"
        :key="index"
        size="sm"
        v-bind="{ color: 'neutral', variant: 'ghost', ...link }"
      />
    </template>
    <UColorModeButton />
  </div>
</template>
