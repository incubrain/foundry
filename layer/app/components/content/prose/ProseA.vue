<script setup lang="ts">
import type { PropType } from 'vue';

const props = defineProps({
  href: {
    type: String,
    default: '',
  },
  target: {
    type: String as PropType<
      | '_blank'
      | '_parent'
      | '_self'
      | '_top'
      | (string & object)
      | null
      | undefined
    >,
    default: undefined,
    required: false,
  },
});

const { getPageMetadata, resolveInternalPath } = useContentConfig();

const isInternalLink = computed(() => props.href?.startsWith('internal:'));

// Convert internal: prefix to full path with docs prefix
const internalHref = computed(() => {
  if (!isInternalLink.value) return props.href;
  const path = props.href.replace('internal:', '');
  return resolveInternalPath(path);
});

const internalPageData = computed(() => {
  if (!isInternalLink.value) return null;
  return getPageMetadata(internalHref.value);
});
</script>

<template>
  <!-- Internal documentation link with popover -->
  <UPopover
    v-if="isInternalLink"
    mode="hover"
    :open-delay="300"
    :close-delay="100"
    :content="{ side: 'top', align: 'center' }"
    :ui="{ content: 'p-2 text-sm max-w-xs' }"
  >
    <NuxtLink
      :to="internalHref"
      class="font-medium underline underline-offset-[3px] decoration-dotted decoration-neutral-400 dark:decoration-neutral-500 transition-all duration-200"
    >
      <UIcon
        name="i-lucide-file-text"
        class="mr-1 inline-block text-primary size-3.5 align-baseline"
      />
      <slot />
    </NuxtLink>

    <template #content>
      <div
        v-if="internalPageData"
        class="text-gray-700 dark:text-gray-300 space-y-1"
      >
        <div class="font-semibold text-gray-900 dark:text-gray-100">
          {{ internalPageData.title }}
        </div>
        <div v-if="internalPageData.description" class="text-xs">
          {{ internalPageData.description }}
        </div>
      </div>
      <div v-else class="text-gray-700 dark:text-gray-300">
        Internal link to: <span class="font-semibold">{{ internalHref }}</span>
      </div>
    </template>
  </UPopover>

  <!-- Regular link: render as normal -->
  <NuxtLink v-else :href="props.href" :target="props.target">
    <slot />
  </NuxtLink>
</template>
