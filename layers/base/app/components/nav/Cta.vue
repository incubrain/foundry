<script setup lang="ts">
import type { SectionCta } from '#shared/types/config';

interface Props {
  cta?: SectionCta;
  title?: string;
  description?: string;
  variant?: 'outline' | 'solid' | 'soft' | 'subtle' | 'naked';
  orientation?: 'vertical' | 'horizontal';
}

const props = withDefaults(defineProps<Props>(), {
  cta: undefined,
  title: undefined,
  description: undefined,
  variant: 'outline',
  orientation: 'vertical',
});

// Computed values to handle mix of direct props and cta object
const displayTitle = computed(() => props.title || props.cta?.headline);
const displayDescription = computed(
  () => props.description || props.cta?.message,
);
// Generate links only if cta object is present and using default button logic
const defaultLinks = computed(() => {
  if (props.cta && !props.cta.primary) {
    return [
      {
        label: props.cta.button.label,
        to: props.cta.button.to,
        trailingIcon: props.cta.button.icon,
        color: 'secondary',
        variant: 'subtle',
        size: 'lg',
      },
    ];
  }
  return [];
});
</script>

<template>
  <div class="relative">
    <!-- Corner brackets -->
    <div class="absolute inset-0 pointer-events-none z-10">
      <div
        class="absolute -top-px -left-px w-12 h-12 border-t-2 border-l-2 rounded-tl-lg border-secondary/30"
      />
      <div
        class="absolute -top-px -right-px w-12 h-12 border-t-2 border-r-2 rounded-tr-lg border-secondary/30"
      />
      <div
        class="absolute -bottom-px -left-px w-12 h-12 border-b-2 border-l-2 rounded-bl-lg border-secondary/30"
      />
      <div
        class="absolute -bottom-px -right-px w-12 h-12 border-b-2 border-r-2 rounded-br-lg border-secondary/30"
      />
    </div>

    <UPageCTA
      :title="displayTitle"
      :description="displayDescription"
      :orientation="orientation"
      :variant="variant"
      :links="defaultLinks"
      :ui="{
        container: 'py-16 sm:py-20',
        title: 'text-xl font-bold text-secondary',
        description: 'text-sm sm:text-base',
      }"
    >
      <!-- Expose slots -->
      <template #links>
        <slot name="links" />
      </template>

      <template v-if="cta?.primary" #footer>
        <div class="max-w-2xl mx-auto pt-4">
          <ConvertForm
            location="section-cta"
            submit-label="Get Access"
            layout="horizontal"
          />
        </div>
      </template>
    </UPageCTA>
  </div>
</template>
