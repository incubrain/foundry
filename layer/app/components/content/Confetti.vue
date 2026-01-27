<script setup lang="ts">
import confetti from 'canvas-confetti';

const props = withDefaults(
  defineProps<{
    particleCount?: number;
    spread?: number;
    originY?: number;
  }>(),
  {
    particleCount: 100,
    spread: 70,
    originY: 0.6,
  },
);

onMounted(() => {
  confetti({
    particleCount: props.particleCount,
    spread: props.spread,
    origin: { y: props.originY },
  });
});
</script>

<template>
  <slot />
</template>
