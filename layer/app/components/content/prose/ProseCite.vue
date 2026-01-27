<script setup lang="ts">
const props = defineProps({
  id: {
    type: String,
    default: '',
  },
});

const { addCitation, getCitationIndex, getReference } = useCitations();

// Support multiple citations separated by commas: :cite{#id1,id2,id3}
const citationIds = computed(() => {
  if (!props.id) return [];
  return props.id.split(',').map((id) => id.trim());
});

// Register all citations
citationIds.value.forEach((id) => {
  if (id) addCitation(id);
});

const citationRefs = computed(() =>
  citationIds.value.map((id) => getReference(id).value).filter(Boolean),
);

const extractRootDomain = (url: string | null) => {
  if (!url) return 'NO URL';
  const urlObj = new URL(url);
  return urlObj.origin;
};
</script>

<template>
  <span>
    <slot />
    <sup
      class="text-[0.75em] ms-1 me-0 align-super leading-none tracking-tight inline-block"
    >
      <template v-for="(id, index) in citationIds" :key="id">
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
        <span v-if="index < citationIds.length - 1" class="mr-0.5">,</span>
      </template>
    </sup>
  </span>
</template>
