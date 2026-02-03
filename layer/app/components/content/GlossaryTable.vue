<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui';

const { allTermsWithCategory, categoryColors } = useGlossary();

// Sort alphabetically
const allTerms = computed(() => {
  return [...allTermsWithCategory.value].sort((a, b) =>
    a.term.localeCompare(b.term),
  );
});

// Cast to BadgeProps color type
const categoryColor = computed<Record<string, BadgeProps['color']>>(() => {
  return categoryColors.value as Record<string, BadgeProps['color']>;
});

// Watch for hash changes
const route = useRoute();
const globalFilter = ref('' as string);

watch(
  () => route.query,
  (newQuery) => {
    if (newQuery) {
      nextTick(() => {
        globalFilter.value = String(newQuery.search ?? '');
      });
    }
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <div class="space-y-6 w-full overflow-hidden">
    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4">
      <UInput
        v-model="globalFilter"
        placeholder="Search terms..."
        icon="i-lucide-search"
        class="flex-1"
      />
    </div>

    <!-- ✅ PATTERN 1: Merged Term Column -->
    <div class="overflow-x-auto">
      <UTable
        v-model:global-filter="globalFilter"
        :data="allTerms"
        :columns="[
          {
            accessorKey: 'id',
            header: 'ID',
            size: 100,
            minSize: 100,
            maxSize: 100,
            meta: {
              class: {
                td: 'max-w-[100px] text-xs',
                th: 'max-w-[100px]',
              },
            },
          },
          {
            accessorKey: 'term',
            header: 'Term',
            size: 300,
            minSize: 200,
            maxSize: 400,
            meta: {
              class: {
                td: 'max-w-[400px]',
                th: 'max-w-[400px]',
              },
            },
          },
          {
            accessorKey: 'definition',
            header: 'Definition',
            size: 600,
            minSize: 300,
            maxSize: 600,
            meta: {
              class: {
                td: 'max-w-[600px]',
                th: 'max-w-[600px]',
              },
            },
          },
        ]"
        :ui="{
          root: 'border border-default rounded-lg',
          base: 'min-w-full',
        }"
      >
        <!-- ✅ Merged Term Column: Term + Abbreviation + Category -->
        <template #term-cell="{ row }">
          <!-- Term + Abbreviation (inline) -->
          <div class="font-semibold text-base text-highlighted text-balance">
            {{ row.original.term }}
            <span
              v-if="row.original.abbreviation"
              class="font-normal text-sm text-muted ml-1"
            >
              ({{ row.original.abbreviation }})
            </span>
          </div>

          <!-- Category Badge -->
          <div>
            <UBadge
              :label="row.original.categoryLabel"
              :color="categoryColor[row.original.category] ?? 'neutral'"
              variant="soft"
              size="xs"
            />
          </div>
        </template>

        <!-- ✅ Definition Column: Full width, wraps naturally -->
        <template #definition-cell="{ row }">
          <div class="text-sm text-default leading-relaxed text-balance">
            {{ row.original.definition }}
          </div>
        </template>
      </UTable>
    </div>
  </div>
</template>
