<!-- app/components/section/SectionHeader.vue -->
<script setup lang="ts">
interface Props {
  title?: string;
  description?: string;
  headline?: string;
  align?: 'left' | 'center' | 'right';
}

withDefaults(defineProps<Props>(), {
  title: undefined,
  description: undefined,
  headline: undefined,
  align: 'center',
});
</script>

<template>
  <div
    :class="[
      'relative z-10 space-y-3 max-w-3xl',
      align === 'center' ? 'mx-auto text-center' : '',
    ]"
  >
    <div
      v-if="headline || $slots.headline"
      class="text-primary font-bold text-sm uppercase tracking-wider"
    >
      <slot name="headline">{{ headline }}</slot>
    </div>

    <h2
      v-if="title || $slots.title"
      class="text-3xl sm:text-4xl font-heading font-bold text-highlighted"
    >
      <slot name="title">{{ title }}</slot>
    </h2>

    <p
      v-if="description || $slots.description"
      :class="[
        'text-lg text-muted leading-relaxed',
        align === 'center' ? 'max-w-2xl mx-auto' : '',
      ]"
    >
      <slot name="description">{{ description }}</slot>
    </p>
  </div>
</template>
