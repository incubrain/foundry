<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui';
import type { Collection, PageCollections } from '@nuxt/content';
import type { TableMeta, Row } from '@tanstack/vue-table';

const appConfig = useAppConfig();
const glossaryCollection = appConfig.contentCollections?.glossary || 'glossary';

// Fetch all glossary terms
const { data: glossaryData } = await useAsyncData('glossary-terms', () =>
  queryCollection(glossaryCollection).all(),
);

// Extract all terms with their category metadata
const allTermsWithCategory = computed(() => {
  if (!glossaryData.value) return [];
  return glossaryData.value.flatMap((file) =>
    (file.terms || []).map((term: any) => ({
      ...term,
      category: file.category.id,
      categoryLabel: file.category.label,
      categoryColor: file.category.color || 'neutral',
    })),
  );
});

// Sort alphabetically
const allTerms = computed(() => {
  return [...allTermsWithCategory.value].sort((a, b) =>
    a.term.localeCompare(b.term),
  );
});

// Filter state
const searchQuery = ref('');
const selectedCategory = ref<string>('all');

// Build category options dynamically from content
const categoryOptions = computed(() => {
  if (!glossaryData.value) return [{ label: 'All Categories', value: 'all' }];

  const categories = glossaryData.value.map((file: any) => ({
    label: file.category.label,
    value: file.category.id,
  }));

  return [{ label: 'All Categories', value: 'all' }, ...categories];
});

// Build category colors map from content
const categoryColor = computed<Record<string, BadgeProps['color']>>(() => {
  if (!glossaryData.value) return {};

  const colorMap: Record<string, BadgeProps['color']> = {};
  glossaryData.value.forEach((file: any) => {
    colorMap[file.category.id] = file.category.color || 'neutral';
  });

  return colorMap;
});

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

const meta = computed<TableMeta<any>>(() => ({
  class: {
    tr: (row: Row<any>) => {
      if (
        highlightedTermId.value &&
        highlightedTermId.value === getTermId(row.original.id)
      ) {
        return 'bg-primary/10';
      }
      return '';
    },
  },
}));

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
      :meta="meta"
    >
      <template #term-cell="{ row }">
        <div
          class="font-semibold transition-colors duration-300"
          :id="getTermId(row.original.id)"
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
