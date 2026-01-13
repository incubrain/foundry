<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui';
// Fetch MCP resources
// Fetch references from content collection
const { data: references } = await useAsyncData('references-table', () =>
  queryCollection('references').all(),
);

const sources = computed(() => {
  if (!references.value) return [];

  return references.value.map((r) => ({
    name: r.title, // Map 'title' to 'name' for the table
    credibility: r.credibility || 'unknown',
    lastVerified: 'Jan 2026', // Static for now as per verified source policy
    description: r.description || '',
    url: r.url || '#',
    author: r.author || 'Unknown',
    date: r.date || 'Unknown',
    topics: r.topics || [],
  }));
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
            :href="row.original.url"
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

    <div class="mt-6 text-sm text-gray-600 dark:text-gray-400 space-y-2">
      <p>
        <strong>Verification Policy:</strong> Sources are manually verified
        quarterly. Last comprehensive review: January 2026.
      </p>
      <p>
        <strong>AI Access:</strong> All sources are available to AI tools via
        our <a href="/mcp" class="text-primary hover:underline">MCP server</a>.
      </p>
    </div>
  </div>
</template>
