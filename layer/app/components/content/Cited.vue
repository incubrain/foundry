<script setup lang="ts">
const props = defineProps<{ id: string }>();

const { addCitation, getCitationIndex, getReference, validateCitation } =
  useCitations();

// Support multiple citations separated by commas: :cited[text for cite]{#id1,id2,id3}
const citationIds = computed(() => {
  if (!props.id) return [];
  return props.id.split(',').map((id) => id.trim());
});

// Register all citations
citationIds.value.forEach((id) => {
  if (id) addCitation(id);
});

const citationRefs = computed(() =>
  citationIds.value.map((id) => getReference(id).value),
);

// Validate each citation and collect errors
const validationResults = computed(() =>
  citationIds.value.map((id) => validateCitation(id).value),
);

const hasInvalidCitations = computed(() =>
  validationResults.value.some((v) => !v.valid && !v.loading),
);

const isDev = import.meta.dev;

// Log warnings in dev mode for invalid citations
if (isDev) {
  watchEffect(() => {
    validationResults.value.forEach((result) => {
      if (!result.valid && !result.loading) {
        console.warn(`[Cited] ${result.message}`);
      }
    });
  });
}

const extractRootDomain = (url: string | null) => {
  if (!url) return 'NO URL';
  const urlObj = new URL(url);
  return urlObj.origin;
};

defineSlots<{
  default(props?: {}): any
}>();
</script>

<template>
  <span>
    <slot />
    <sup
      class="text-[0.75em] ms-1 me-0 align-super leading-none tracking-tight inline-block"
    >
      <template v-for="(id, index) in citationIds" :key="id">
        <!-- Valid citation -->
        <UTooltip
          v-if="citationRefs[index]"
          :delay-duration="0"
          :text="
            extractRootDomain(
              citationRefs[index].pdf || citationRefs[index].url || null,
            )
          "
          :ui="{ content: 'max-w-xs' }"
        >
          <a
            :href="citationRefs[index].pdf || citationRefs[index].url || '#'"
            target="_blank"
            rel="noopener noreferrer"
            class="no-underline text-primary font-medium"
          >
            [{{ getCitationIndex(id).value }}]
          </a>
        </UTooltip>
        <!-- Invalid citation - dev mode visual feedback -->
        <UTooltip
          v-else-if="
            isDev &&
            validationResults[index] &&
            !validationResults[index].valid &&
            !validationResults[index].loading
          "
          :delay-duration="0"
          :text="validationResults[index].message"
          :ui="{ content: 'max-w-sm' }"
        >
          <span
            class="text-red-500 font-medium cursor-help border-b border-dashed border-red-500"
          >
            [?{{ id }}]
          </span>
        </UTooltip>
        <span v-if="index < citationIds.length - 1" class="mr-0.5">,</span>
      </template>
    </sup>
  </span>
</template>
