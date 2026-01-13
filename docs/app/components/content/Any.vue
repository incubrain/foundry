<script setup lang="ts">
const props = defineProps<{
  id: string; // Reference ID
}>();

const { addCitation, getCitationIndex } = useCitations();

// Register citation
addCitation(props.id);

const index = getCitationIndex(props.id);
</script>

<template>
  <sup class="citation-mark tracking-tight inline-block">
    <a
      :href="`#ref-${id}`"
      class="no-underline text-primary hover:underline"
    >
      [{{ index }}]
    </a>
  </sup>
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
