<script setup lang="ts">
const props = defineProps<{
  id: string;
}>();

const { getTerm, resolveGlossaryPath } = useGlossary();

const termData = computed(() => {
  if (!props.id) return null;
  return getTerm(props.id).value;
});

const glossaryHref = computed(() => {
  if (!props.id) return '';
  return resolveGlossaryPath(props.id);
});

defineSlots<{
  default: () => {},
}>();
</script>

<template>
  <!-- Glossary term with popover when data available -->
  <UPopover
    v-if="termData"
    mode="hover"
    :open-delay="300"
    :close-delay="100"
    :content="{ side: 'top', align: 'center' }"
    :ui="{ content: 'p-3 text-sm max-w-md' }"
  >
    <NuxtLink
      :to="glossaryHref"
      class="underline decoration-dotted decoration-neutral-400 dark:decoration-neutral-500 underline-offset-[3px] font-medium hover:decoration-solid hover:decoration-neutral-500 dark:hover:decoration-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-all"
    >
      <dfn :id="`def-${id}`">
        <slot />
      </dfn>
    </NuxtLink>

    <template #content>
      <div class="space-y-1">
        <div class="font-semibold text-gray-900 dark:text-gray-100">
          {{ termData.term }}
          <span
            v-if="termData.abbreviation"
            class="font-mono text-xs text-gray-600 dark:text-gray-400"
          >
            ({{ termData.abbreviation }})
          </span>
        </div>
        <div class="text-gray-700 dark:text-gray-300">
          {{ termData.definition }}
        </div>
        <div v-if="termData.category" class="pt-1">
          <UBadge
            :label="termData.category"
            :color="
              termData.category === 'technical'
                ? 'primary'
                : termData.category === 'regulatory'
                  ? 'warning'
                  : termData.category === 'ecological'
                    ? 'success'
                    : 'neutral'
            "
            variant="soft"
            size="xs"
          />
        </div>
      </div>
    </template>
  </UPopover>

  <!-- Fallback: link without popover -->
  <NuxtLink
    v-else
    :to="glossaryHref"
    class="underline decoration-dotted decoration-primary-400 dark:decoration-primary-500 underline-offset-[3px] text-primary-600 dark:text-primary-400 font-medium hover:decoration-solid hover:decoration-primary-500 dark:hover:decoration-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-all"
  >
    <dfn :id="`def-${id}`">
      <slot />
    </dfn>
  </NuxtLink>
</template>
