<script setup lang="ts">
const props = defineProps<{
  id: string | string[]; // ✅ Support single or multiple
}>();

const { addCitation, getCitationIndex } = useCitations();

const ids = computed(() => Array.isArray(props.id) ? props.id : [props.id]);

// Register all citations
ids.value.forEach(id => addCitation(id));
</script>

<template>
  <sup class="citation-mark tracking-tight inline-block">
    <template v-for="(id, i) in ids" :key="id">
      <a
        :href="`#ref-${id}`"
        class="no-underline text-primary hover:underline"
      >
        [{{ getCitationIndex(id).value }}]
      </a>
      <span v-if="i < ids.length - 1" class="mr-0.5">,</span>
    </template>
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
