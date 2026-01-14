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

const { addCitation, getCitationIndex } = useCitations();

// Check if this is a citation link (href starts with "cite:")
const isCitation = computed(() => props.href?.startsWith('cite:'));

// Support multiple citations separated by commas: cite:id1,id2,id3
const citationIds = computed(() => {
  if (!isCitation.value) return [];
  const idsString = props.href.replace('cite:', '');
  return idsString.split(',').map(id => id.trim());
});

// Register all citations
citationIds.value.forEach(id => {
  if (id) addCitation(id);
});
</script>

<template>
  <!-- Citation link: render as superscript citation marks -->
  <sup v-if="isCitation" class="citation-mark tracking-tight inline-block">
    <template v-for="(id, index) in citationIds" :key="id">
      <a
        :href="`#ref-${id}`"
        class="no-underline text-primary hover:underline"
      >
        [{{ getCitationIndex(id).value }}]
      </a>
      <span v-if="index < citationIds.length - 1" class="mr-0.5">,</span>
    </template>
  </sup>

  <!-- Regular link: render as normal -->
  <NuxtLink v-else :href="props.href" :target="props.target">
    <slot />
  </NuxtLink>
</template>

<style scoped>
.citation-mark {
  font-size: 0.75em;
  margin-inline-end: 0;
  margin-inline-start: 0;
  vertical-align: super;
  line-height: 0;
}
</style>
