<script setup lang="ts">
interface Props {
  id: string;
}

const props = defineProps<Props>();

const anchorOffset = '--spacing(12)';

onMounted(() => {
  const element = document.getElementById(props.id);
  if (element) {
    element.style.scrollMarginTop = anchorOffset;
  }
});
</script>

<template>
  <div
    :id="id"
    :style="{ scrollMarginTop: anchorOffset }"
    class="anchor-target"
  />
</template>

<style scoped>
.anchor-target {
  position: relative;
  pointer-events: none;
}
</style>
