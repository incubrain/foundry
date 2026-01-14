<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui';

// Fetch references from content collection
const { data: allCategoryRefs } = await useAsyncData('references-table', () =>
  queryCollection('references').all(),
);

// ✅ Flatten all sources from all categories
const sources = computed(() => {
  if (!allCategoryRefs.value) return [];

  return allCategoryRefs.value.flatMap((cat) =>
    cat.sources.map((source) => ({
      name: source.title,
      credibility: source.credibility || 'unknown',
      lastVerified: 'Jan 2026',
      description: source.description || '',
      url: source.url || '#',
      pdf: source.pdf,
      author: source.author || 'Unknown',
      date: source.date || 'Unknown',
      topics: source.topics || [],
    })),
  );
});

const credibilityColor: Record<string, BadgeProps['color']> = {
  government: 'primary',
  academic: 'secondary',
  media: 'neutral',
  ngo: 'warning',
  unknown: 'neutral',
};

const credibilityLabels = {
  government: 'Government',
  academic: 'Academic',
  media: 'Media',
  ngo: 'NGO',
};
</script>

<template>
  <div class="my-8">
    <UTable
      :data="sources"
      :columns="[
        { accessorKey: 'name', header: 'Document' },
        { accessorKey: 'credibility', header: 'Type' },
        { accessorKey: 'lastVerified', header: 'Last Verified' },
      ]"
    >
      <template #name-cell="{ row }">
        <div class="flex flex-col gap-2">
          <a
            :href="row.original.pdf || row.original.url"
            target="_blank"
            class="text-primary hover:underline inline-flex items-center gap-1"
          >
            {{ row.original.name }}
            <UIcon
              name="i-heroicons-arrow-top-right-on-square-20-solid"
              class="w-3 h-3"
            />
          </a>
          {{ row.original.description }}
        </div>
      </template>

      <template #credibility-cell="{ row }">
        <UBadge
          :label="row.original.credibility"
          :color="
            credibilityColor[String(row.original.credibility)] ?? 'neutral'
          "
          variant="soft"
          size="xs"
        />
      </template>

      <template #lastVerified-cell="{ row }">
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ row.original.lastVerified }}
        </span>
      </template>
    </UTable>
  </div>
</template>
