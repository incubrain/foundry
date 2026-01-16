<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui';

// ✅ Use cached references from useCitations
const { allCategoryRefs } = useCitations();

const categoryLabels: Record<string, string> = {
  ecology: 'Ecology & Biodiversity',
  health: 'Human Health',
  climate: 'Climate & Energy',
  tourism: 'Tourism & Economy',
  policy: 'Policy & Legal Frameworks',
  standards: 'Standards & Implementation',
  astronomy: 'Astronomy & Sky Quality',
  internal: 'Internal Research',
};

const credibilityColor: Record<string, BadgeProps['color']> = {
  government: 'primary',
  academic: 'secondary',
  media: 'neutral',
  ngo: 'warning',
  educational: 'info',
  unknown: 'neutral',
};
</script>

<template>
  <div class="space-y-12">
    <!-- ✅ Loop through each category -->
    <div
      v-for="category in allCategoryRefs"
      :key="category.category"
      class="space-y-4"
    >
      <h2 class="text-2xl font-bold">
        {{ categoryLabels[category.category] || category.category }}
      </h2>

      <UTable
        :data="category.sources"
        :columns="[
          { accessorKey: 'title', header: 'Document' },
          { accessorKey: 'credibility', header: 'Type' },
          { accessorKey: 'date', header: 'Date' },
        ]"
      >
        <template #title-cell="{ row }">
          <div class="flex flex-col gap-2">
            <a
              :href="row.original.pdf || row.original.url"
              target="_blank"
              class="text-primary hover:underline inline-flex items-center gap-1"
            >
              {{ row.original.title }}
              <UIcon
                name="i-heroicons-arrow-top-right-on-square-20-solid"
                class="w-3 h-3"
              />
            </a>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ row.original.description }}
            </span>
          </div>
        </template>

        <template #credibility-cell="{ row }">
          <UBadge
            :label="row.original.credibility"
            :color="credibilityColor[row.original.credibility] ?? 'neutral'"
            variant="soft"
            size="xs"
          />
        </template>

        <template #date-cell="{ row }">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ row.original.date }}
          </span>
        </template>
      </UTable>
    </div>
  </div>
</template>
