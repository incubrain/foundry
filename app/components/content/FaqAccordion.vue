<!-- app/components/content/FaqAccordion.vue -->
<script setup lang="ts">
import type { AccordionItem, TabsItem } from '@nuxt/ui';

interface Props {
  title?: string;
  description?: string;
  // Filter by specific FAQ type(s) - if not provided, shows all
  types?: string[];
  // If false, hide tabs (useful for single-type FAQ)
  showTabs?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showTabs: true,
});

// Always fetch from collection
const { data: allFaqs } = await useAsyncData('faqs-content', () =>
  queryCollection('faq').all(),
);

// Filter by types if provided
const faqCategories = computed(() => {
  if (!allFaqs.value) return [];
  if (!props.types?.length) return allFaqs.value;
  return allFaqs.value.filter((faq) => props.types.includes(faq.type));
});

// Build tab items
const tabItems = computed<TabsItem[]>(() => {
  if (!props.showTabs || faqCategories.value.length <= 1) return [];

  return faqCategories.value.map((category) => ({
    label: category.label,
    icon: category.icon,
    value: category.type,
    badge: {
      label: String(category.items.length),
      color: 'neutral',
      variant: 'solid',
      size: 'xs',
    },
    slot: category.type,
  }));
});

const activeTab = ref(faqCategories.value[0]?.type || '');

// Get active category FAQs
const activeFaqs = computed(() => {
  const category = faqCategories.value.find(
    (cat) => cat.type === activeTab.value,
  );
  if (!category) return [];

  return category.items.map((item) => ({
    label: item.label,
    content: item.content,
    icon: category.icon,
    color: category.color,
  }));
});

// Build accordion items
const accordionItems = computed<AccordionItem[]>(() =>
  activeFaqs.value.map((faq, i) => ({
    value: String(i),
    label: faq.label,
    content: faq.content,
    icon: faq.icon,
    ui: {
      leadingIcon: `text-${faq.color}`,
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

      <!-- Tabs (if multiple categories and showTabs=true) -->
      <UTabs
        v-if="tabItems.length > 0"
        v-model="activeTab"
        :items="tabItems"
        :content="false"
        color="neutral"
        variant="link"
        size="md"
        class="w-full"
        :ui="{
          root: 'flex-col items-center',
          list: [
            'relative flex p-1 group',
            'w-full overflow-x-auto',
            'gap-2 border-0',
            'justify-start md:justify-center',
            'scrollbar-hide',
            'border-b-0! mb-0!',
          ].join(' '),
          trigger: [
            'inline-flex items-center gap-1.5',
            'rounded-full border px-4 py-2',
            'whitespace-nowrap shrink-0',
            'border-neutral-700/40 bg-neutral-900/30',
            'data-[state=active]:border-primary data-[state=active]:bg-primary/10',
            'hover:border-neutral-600 hover:bg-neutral-900/50',
            'transition-all duration-200',
            'text-sm font-medium',
            'data-[state=inactive]:text-muted',
            'data-[state=active]:text-highlighted',
          ].join(' '),
          indicator: 'hidden',
        }"
      />

      <!-- Accordion -->
      <div v-if="accordionItems.length">
        <UAccordion
          :items="accordionItems"
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

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
