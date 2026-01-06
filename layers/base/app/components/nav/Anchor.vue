<!-- layers/base/app/components/nav/Anchor.vue -->
<script setup lang="ts">
import { useNavigation, type SectionId } from '#shared/navigation';

interface Props {
  id: SectionId;
}

const props = defineProps<Props>();

const { data: navigation } = await useNavigation();

const getStickyOffset = () => {
  if (!navigation.value) return '--spacing(12)';

  const banner = navigation.value.layout.banner?.sticky
    ? 'var(--ui-banner-height)+'
    : '';

  const navbar = navigation.value.layout.navbar?.sticky
    ? 'var(--ui-header-height)+'
    : '';

  const offset = '--spacing(12)';

  return `calc(${banner}${navbar}${offset})`;
};

const anchorOffset = computed(() => getStickyOffset());

onMounted(() => {
  const element = document.getElementById(props.id);
  if (element) {
    element.style.scrollMarginTop = anchorOffset.value;
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
