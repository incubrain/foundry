<script setup lang="ts">
import type { HeaderConfig } from '#navigation'

const headerData = inject<Ref<HeaderConfig>>('navigation_header')

const showSearch = computed(() => headerData?.value?.showSearch ?? true)
const showColorMode = computed(() => headerData?.value?.showColorMode ?? true)

const socials = computed(() => (headerData?.value?.socials ?? {}) as Record<string, string>)
const socialLinks = useSocialLinks(socials)
</script>

<template>
  <div class="flex items-center gap-1">
    <UContentSearchButton
      v-if="showSearch"
      class="lg:hidden"
    />

    <ClientOnly>
      <UColorModeButton v-if="showColorMode" />

      <template #fallback>
        <div
          class="h-8 w-8 animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-md"
        />
      </template>
    </ClientOnly>

    <template v-if="socialLinks.length">
      <UButton
        v-for="(link, index) in socialLinks"
        :key="index"
        v-bind="{ color: 'neutral', variant: 'ghost', ...link }"
      />
    </template>
  </div>
</template>
