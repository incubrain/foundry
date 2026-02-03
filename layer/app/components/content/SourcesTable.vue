<script setup lang="ts">
import type { TableColumn, BadgeProps } from '@nuxt/ui'
import { getGroupedRowModel } from '@tanstack/vue-table'

const route = useRoute()
const { allCategoryRefs } = useCitations()
const appConfig = useAppConfig()

// ✅ Global search with URL sync
const globalFilter = ref('' as string)

watch(
  () => route.query,
  (newQuery) => {
    if (newQuery) {
      nextTick(() => {
        globalFilter.value = String(newQuery.search ?? '')
      })
    }
  },
  { immediate: true },
)

// ✅ Transform data: Flatten categories into a single sources array with category metadata
const tableData = computed(() => {
  if (!allCategoryRefs.value) return []

  return allCategoryRefs.value.flatMap(categoryGroup =>
    categoryGroup.sources.map((source: any) => ({
      ...source,
      categoryId: categoryGroup.category.id,
      categoryLabel: categoryGroup.category.label,
    })),
  )
})

// ✅ Grouping Configuration
const grouping = ref(['categoryLabel'])
const expanded = ref(true) // Expand all by default

// ✅ Affiliation colors
const affiliationColor = computed<Record<string, BadgeProps['color']>>(() => ({
  government: 'primary',
  academic: 'secondary',
  media: 'neutral',
  ngo: 'warning',
  educational: 'info',
  industry: 'error',
  ...appConfig.ui?.docs?.affiliation?.colors,
}))

// ✅ Helper to determine link type and icon
const getLinkInfo = (source: any) => {
  const hasUrl = !!source.url && !source.url.toLowerCase().endsWith('.pdf')

  // If explicit PDF field exists, use it. If not, but URL ends in PDF, use URL as PDF link.
  const pdfLink
    = source.pdf
      || (source.url && source.url.toLowerCase().endsWith('.pdf')
        ? source.url
        : null)
  const webLink = hasUrl ? source.url : null

  if (pdfLink && webLink) {
    return {
      primary: pdfLink,
      secondary: webLink,
      primaryIcon: 'i-lucide-file-text',
      secondaryIcon: 'i-lucide-external-link',
      primaryLabel: 'PDF',
      secondaryLabel: 'Website',
    }
  }
  else if (pdfLink) {
    return {
      primary: pdfLink,
      primaryIcon: 'i-lucide-file-text',
      primaryLabel: 'View PDF',
    }
  }
  else if (webLink) {
    return {
      primary: webLink,
      primaryIcon: 'i-lucide-external-link',
      primaryLabel: 'Visit Website',
    }
  }

  return null
}

const columns: TableColumn<any>[] = [
  {
    accessorKey: 'categoryLabel',
    header: 'Category',
    enableHiding: true, // will be hidden by grouping logic usually, but we want to use it for grouping key
  },
  {
    accessorKey: 'title',
    header: 'Document',
    size: 400,
    minSize: 300,
    meta: {
      class: {
        td: 'max-w-[500px] align-top whitespace-normal', // Ensure wrapping
        th: 'max-w-[500px]',
      },
    },
  },
  {
    accessorKey: 'description',
    header: 'Description',
    size: 300,
    minSize: 200,
    meta: {
      class: {
        td: 'max-w-[300px] align-top whitespace-normal text-pretty',
        th: 'max-w-[300px]',
      },
    },
  },
  {
    accessorKey: 'date',
    header: 'Date',
    size: 100,
    minSize: 80,
    maxSize: 100,
    meta: {
      class: {
        td: 'max-w-[100px] align-top',
        th: 'max-w-[100px]',
      },
    },
  },
]
</script>

<template>
  <div class="space-y-6 w-full">
    <!-- ✅ Global Search -->
    <div class="flex flex-col sm:flex-row gap-4">
      <UInput
        v-model="globalFilter"
        placeholder="Search sources..."
        icon="i-lucide-search"
        class="flex-1"
      />
    </div>

    <!-- ✅ Single Unified Table with Grouping -->
    <div class="overflow-x-auto">
      <UTable
        v-model:global-filter="globalFilter"
        v-model:expanded="expanded"
        :data="tableData"
        :columns="columns"
        :grouping="grouping"
        :grouping-options="{
          getGroupedRowModel: getGroupedRowModel(),
          groupedColumnMode: 'remove',
        }"
        :ui="{
          root: 'border border-default rounded-lg',
          base: 'min-w-full',
          td: 'p-4 text-sm text-muted whitespace-nowrap empty:p-0',
        }"
      >
        <!-- Document Cell (Title + Author + Type + Links) -->
        <template #title-cell="{ row }">
          <!-- If this is a Group Row -->
          <div
            v-if="row.getIsGrouped()"
            class="flex items-center gap-2 py-1 cursor-pointer select-none"
            @click="row.toggleExpanded()"
          >
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              :icon="
                row.getIsExpanded()
                  ? 'i-lucide-chevron-down'
                  : 'i-lucide-chevron-right'
              "
              class="-ml-2 pointer-events-none"
            />
            <span
              class="text-lg font-bold text-highlighted uppercase tracking-wide"
            >
              {{ row.getValue('categoryLabel') }}
            </span>
            <span class="text-xs text-muted font-normal ml-2">({{ row.subRows.length }})</span>
          </div>

          <!-- If this is a Normal Source Row -->
          <div
            v-else
            class="space-y-3 whitespace-normal"
          >
            <!-- Title -->
            <div class="font-semibold text-base text-highlighted text-pretty">
              {{ row.original.title }}
            </div>

            <!-- Author & Type Line -->
            <div class="flex flex-wrap items-center gap-2 text-sm">
              <span
                v-if="row.original.author"
                class="text-muted"
              >
                {{ row.original.author }}
              </span>

              <UBadge
                v-if="row.original.affiliation"
                :label="row.original.affiliation"
                :color="affiliationColor[row.original.affiliation] ?? 'neutral'"
                variant="soft"
                size="xs"
                class="capitalize"
              />
            </div>

            <!-- Link Buttons -->
            <div class="flex items-center gap-2 pt-1">
              <template v-if="getLinkInfo(row.original)">
                <UButton
                  :to="getLinkInfo(row.original).primary"
                  :icon="getLinkInfo(row.original).primaryIcon"
                  :label="getLinkInfo(row.original).primaryLabel"
                  size="xs"
                  variant="soft"
                  color="primary"
                  target="_blank"
                />

                <UButton
                  v-if="getLinkInfo(row.original).secondary"
                  :to="getLinkInfo(row.original).secondary"
                  :icon="getLinkInfo(row.original).secondaryIcon"
                  :label="getLinkInfo(row.original).secondaryLabel"
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  target="_blank"
                />
              </template>
            </div>
          </div>
        </template>

        <!-- Description Cell -->
        <template #description-cell="{ row }">
          <div
            v-if="!row.getIsGrouped() && row.original.description"
            class="text-sm text-muted leading-relaxed text-pretty"
          >
            {{ row.original.description }}
          </div>
        </template>

        <!-- Date Cell -->
        <template #date-cell="{ row }">
          <div v-if="!row.getIsGrouped()">
            <span class="text-sm text-muted">{{ row.original.date }}</span>
          </div>
        </template>
      </UTable>
    </div>
  </div>
</template>
