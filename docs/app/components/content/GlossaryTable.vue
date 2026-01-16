<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui';

// Fetch all glossary terms
const { data: glossaryData } = await useAsyncData('glossary-terms', () =>
  queryCollection('glossary').all(),
);

// Flatten all terms from all glossary files and sort alphabetically
const allTerms = computed(() => {
  if (!glossaryData.value) return [];
  return glossaryData.value
    .flatMap((file) => file.terms || [])
    .sort((a, b) => a.term.localeCompare(b.term));
});

// Filter state
const searchQuery = ref('');
const selectedCategory = ref<string>('all');

// Category options
const categoryOptions = [
  { label: 'All Categories', value: 'all' },
  { label: 'Technical', value: 'technical' },
  { label: 'Regulatory', value: 'regulatory' },
  { label: 'Ecological', value: 'ecological' },
  { label: 'General', value: 'general' },
];

// Category colors
const categoryColor: Record<string, BadgeProps['color']> = {
  technical: 'primary',
  regulatory: 'warning',
  ecological: 'success',
  general: 'neutral',
};

// Filtered terms
const filteredTerms = computed(() => {
  let terms = allTerms.value;

  // Filter by category
  if (selectedCategory.value !== 'all') {
    terms = terms.filter((term) => term.category === selectedCategory.value);
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    terms = terms.filter(
      (term) =>
        term.term.toLowerCase().includes(query) ||
        term.abbreviation?.toLowerCase().includes(query) ||
        term.definition.toLowerCase().includes(query),
    );
  }

  return terms;
});

const getTermId = (termId: string) => {
  return `term-${termId}`;
};

// Anchor highlighting
const route = useRoute();
const highlightedTermId = computed(() => {
  if (!route.hash) return null;
  return route.hash.replace('#', '');
});

// Scroll to highlighted term on mount
onMounted(() => {
  if (highlightedTermId.value) {
    nextTick(() => {
      const element = document.getElementById(highlightedTermId.value!);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }
});

// Watch for hash changes
watch(
  () => route.hash,
  (newHash) => {
    if (newHash) {
      nextTick(() => {
        const element = document.getElementById(newHash.replace('#', ''));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  },
);
</script>

<template>
  <div class="space-y-6">
    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4">
      <UInput
        v-model="searchQuery"
        placeholder="Search terms..."
        icon="i-heroicons-magnifying-glass"
        class="flex-1"
      />
      <USelectMenu
        v-model="selectedCategory"
        :options="categoryOptions"
        placeholder="Filter by category"
        class="w-full sm:w-48"
      />
    </div>

    <!-- Results count -->
    <div class="text-sm text-gray-500 dark:text-gray-400">
      Showing {{ filteredTerms.length }} of {{ allTerms.length }} terms
    </div>

    <!-- Glossary Table -->
    <UTable
      :data="filteredTerms"
      :columns="[
        { accessorKey: 'term', header: 'Term' },
        { accessorKey: 'abbreviation', header: 'Abbreviation' },
        { accessorKey: 'definition', header: 'Definition' },
        { accessorKey: 'category', header: 'Category' },
      ]"
    >
      <template #term-cell="{ row }">
        <div
          class="font-semibold transition-colors duration-300"
          :id="getTermId(row.original.id)"
          :class="{
            'bg-primary-100 dark:bg-primary-900/30 px-2 py-1 rounded':
              highlightedTermId === getTermId(row.original.id),
          }"
        >
          {{ row.original.term }}
        </div>
      </template>

      <template #abbreviation-cell="{ row }">
        <div
          v-if="row.original.abbreviation"
          class="text-sm font-mono text-gray-600 dark:text-gray-400"
        >
          {{ row.original.abbreviation }}
        </div>
        <div v-else class="text-gray-400">—</div>
      </template>

      <template #definition-cell="{ row }">
        <div class="text-sm">{{ row.original.definition }}</div>
      </template>

      <template #category-cell="{ row }">
        <UBadge
          v-if="row.original.category"
          :label="row.original.category"
          :color="categoryColor[row.original.category] ?? 'neutral'"
          variant="soft"
          size="xs"
        />
      </template>
    </UTable>
  </div>
</template>
