<script setup lang="ts">
const site = inject<any>('site_config', ref(null));

const socials = computed(() => site.value?.socials ?? {});

const links = computed(() =>
  Object.entries(socials.value).map(([key, url]) => ({
    'icon': key === 'email' ? 'i-lucide-mail' : `i-simple-icons-${key}`,
    'to': url,
    'target': '_blank',
    'aria-label': `${key} social link`,
  })),
);
</script>

<template>
  <div class="flex items-center gap-2">
    <template v-if="links.length">
      <UButton
        v-for="(link, index) in links"
        :key="index"
        size="sm"
        v-bind="{ color: 'neutral', variant: 'ghost', ...link }"
      />
    </template>

    <UColorModeButton />
  </div>
</template>
