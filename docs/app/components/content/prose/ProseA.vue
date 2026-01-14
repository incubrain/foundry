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

const { addCitation, getCitationIndex, getReference } = useCitations();

// Check if this is a citation link (href starts with "cite:")
const isCitation = computed(() => props.href?.startsWith('cite:'));

// Support multiple citations separated by commas: cite:id1,id2,id3
const citationIds = computed(() => {
  if (!isCitation.value) return [];
  const idsString = props.href.replace('cite:', '');
  return idsString.split(',').map((id) => id.trim());
});

// Register all citations
citationIds.value.forEach((id) => {
  if (id) addCitation(id);
});

// ✅ Get reference details for each citation (from cached data)
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
  <!-- Citation link with tooltip + external link -->
  <span v-if="isCitation">
    <slot />
    <sup class="citation-mark tracking-tight inline-block">
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
            class="no-underline text-primary hover:underline"
          >
            [{{ getCitationIndex(id).value }}]
          </a>
        </UTooltip>
        <span v-if="index < citationIds.length - 1" class="mr-0.5">,</span>
      </template>
    </sup>
  </span>

  <!-- Regular link: render as normal -->
  <NuxtLink v-else :href="props.href" :target="props.target">
    <slot />
  </NuxtLink>
</template>

<style scoped>
.citation-mark {
  font-size: 0.75em;
  margin-inline-start: 0.25em;
  margin-inline-end: 0em;
  vertical-align: super;
  line-height: 0;
}
</style>
