<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui';

interface AccordionItemData {
  label: string;
  content: string;
  icon?: string;
  color?: string;
  slot?: string;
}

interface Props {
  title?: string;
  description?: string;
  // Direct items to display (overrides fetching)
  items?: AccordionItemData[];
  // If items not provided, filter fetched FAQs by these types
  types?: string[];
}

const props = defineProps<Props>();

// Fetch from collection if no items provided
const { data: allFaqs } = await useAsyncData(
  'faqs-content',
  () => queryCollection('faq').all(),
  {
    watch: [() => props.items],
    immediate: !props.items?.length,
  },
);

const displayItems = computed(() => {
  // 1. Use direct items if provided
  if (props.items?.length) {
    return props.items;
  }

  // 2. Or build from fetched content
  if (!allFaqs.value) return [];

  // Filter by types if requested
  const filteredFiles = props.types?.length
    ? allFaqs.value.filter((faq) => props.types!.includes(faq.type))
    : allFaqs.value;

  // Flatten all items from matched files into a single list
  return filteredFiles.flatMap((file) =>
    file.items.map((item) => ({
      label: item.label,
      content: item.content,
      icon: file.icon,
      color: file.color,
    })),
  );
});

// Build UI items for Nuxt UI Accordion
const uiItems = computed<AccordionItem[]>(() =>
  displayItems.value.map((item, i) => ({
    value: String(i),
    label: item.label,
    content: item.content,
    icon: item.icon,
    ui: {
      leadingIcon: `text-${item.color}`,
      trigger: 'text-base font-medium py-4',
      body: 'text-muted pb-4 pl-7',
    },
  })),
);
</script>

<template>
  <section class="my-16">
    <div class="max-w-3xl mx-auto space-y-8">
      <!-- Section Header -->
      <div v-if="title || description" class="space-y-3">
        <h2 v-if="title" class="text-3xl font-bold text-highlighted">
          {{ title }}
        </h2>
        <p v-if="description" class="text-lg text-muted">
          {{ description }}
        </p>
      </div>

      <!-- Accordion -->
      <div v-if="uiItems.length">
        <UAccordion
          :items="uiItems"
          :unmount-on-hide="false"
          :ui="{
            item: 'border-b border-neutral-800 first:border-t last:mb-0 overflow-hidden last:border-b',
            trigger:
              'group flex-1 flex items-center gap-3 font-medium text-sm p-4 hover:bg-muted/30 transition-colors',
            body: 'text-sm p-4 leading-relaxed',
            leadingIcon: 'size-4',
            content: 'data-[state=open]:bg-muted/30',
          }"
        />
      </div>
    </div>
  </section>
</template>
