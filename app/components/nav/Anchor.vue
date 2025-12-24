<!-- components/nav/Anchor.vue -->
<script setup lang="ts">
import { NAVIGATION, type SectionId } from '#shared/config/navigation';

interface Props {
  id: SectionId;
}

const props = defineProps<Props>();

const getStickyOffset = () => {
  const banner = NAVIGATION.layout.banner?.sticky
    ? 'var(--ui-banner-height)+'
    : '';

  const navbar = NAVIGATION.layout.navbar?.sticky
    ? 'var(--ui-header-height)+'
    : '';

  const offset = '--spacing(12)';

  return `calc(${banner}${navbar}${offset})`;
};

const anchorOffset = getStickyOffset();

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
