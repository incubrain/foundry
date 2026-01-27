<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui';

interface CardContent {
  title: string;
  description: string;
  cta: {
    label: string;
    to: string;
    icon?: string;
  };
  class?: string;
}

interface Props {
  policy?: CardContent;
  pilot?: CardContent;
}

const props = withDefaults(defineProps<Props>(), {
  policy: () => ({
    title: 'Policy Framework',
    description: `**Legal Foundation & Regulatory Models**

Over 40 jurisdictions worldwide have enacted Dark Sky legislation. Maharashtra can adopt tested frameworks leveraging:

- CMS Light Pollution Guidelines (India signatory)
- Wildlife Protection Act 1972 + NGT Directive 2024
- State climate commitments (SAPCCHH)
- Cross-departmental coordination

**Pathway:** Steering Committee → Broader Guidelines → ALAN notification → Pilot implementation → Statewide rollout`,
    cta: {
      label: 'Explore Policy Details',
      to: '/darksky/policy',
      icon: 'i-lucide-arrow-right',
    },
    class: 'hover:border-primary',
  }),
  pilot: () => ({
    title: 'Pilot Projects',
    description: `**Dark Sky Place Certification**

Working with MITRA, AstronEra has identified **11 pilot sites** across Maharashtra to validate regulatory models.

**Phase I (2026-2029):** Launch DSI certified pilots, publish Broader Guidelines, amend Tourism Policy

**Phase II (2029-2035):** Expand to all zone types, statewide retrofits, strengthen enforcement

**Phase III (2035-2047):** Maharashtra shapes National ALAN Policy`,
    cta: {
      label: 'View Pilot Sites',
      to: '/darksky/pilots',
      icon: 'i-lucide-map-pin',
    },
    class: 'hover:border-success',
  }),
});
</script>

<template>
  <div class="grid md:grid-cols-2 gap-8">
    <UCard :class="['transition-colors', policy.class]">
      <template #header>
        <h3 class="text-xl font-semibold">{{ policy.title }}</h3>
      </template>

      <NuxtImg src="https://placehold.co/600x600" />

      <template #footer>
        <MDC :value="policy.description" />
        <UButton
          :label="policy.cta.label"
          :to="policy.cta.to"
          :trailing-icon="policy.cta.icon"
          variant="outline"
          block
          class="mt-6"
        />
      </template>
    </UCard>

    <UCard :class="['transition-colors', pilot.class]">
      <template #header>
        <h3 class="text-xl font-semibold">{{ pilot.title }}</h3>
      </template>
      <NuxtImg src="https://placehold.co/600x600" />
      <template #footer>
        <MDC :value="pilot.description" />
        <UButton
          :label="pilot.cta.label"
          :to="pilot.cta.to"
          :trailing-icon="pilot.cta.icon"
          variant="outline"
          block
          class="mt-6"
        />
      </template>
    </UCard>
  </div>
</template>
