<script setup lang="ts">
const { citations, reset } = useCitations();

// Query references data
const { data: allCategoryRefs } = await useAsyncData('references-data', () =>
  queryCollection('references').all(),
);

// ✅ Flatten all sources from all categories
const allRefs = computed(() => {
  if (!allCategoryRefs.value) return [];
  return allCategoryRefs.value.flatMap((cat) =>
    cat.sources.map((source) => ({
      ...source,
      category: cat.category,
    })),
  );
});

// Filter and sort references based on citation order
const sortedRefs = computed(() => {
  if (!allRefs.value || !citations.value.length) return [];

  return citations.value
    .map((id) => allRefs.value.find((r: any) => r.id === id))
    .filter(Boolean);
});

const credibilityColors: Record<string, string> = {
  government: 'primary',
  academic: 'blue',
  educational: 'purple',
  media: 'gray',
  ngo: 'green',
};

const credibilityLabels: Record<string, string> = {
  government: 'Government Source',
  academic: 'Academic Source',
  educational: 'Educational Resource',
  media: 'Media Source',
  ngo: 'NGO Report',
};

// ✅ Reset citations when component unmounts (route change)
onUnmounted(() => {
  reset();
});

// ✅ Scroll to anchor on mount if hash present
onMounted(() => {
  const hash = window.location.hash;
  if (hash) {
    setTimeout(() => {
      const el = document.querySelector(hash);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }
});
</script>

<template>
  <div
    v-if="sortedRefs.length"
    class="bibliography mt-12 pt-8 border-t border-gray-200 dark:border-gray-800"
  >
    <!-- ✅ Two columns on large screens -->
    <div class="space-y-4 lg:columns-2 lg:gap-8">
      <div
        v-for="(ref, idx) in sortedRefs"
        :id="`ref-${ref.id}`"
        :key="ref.id"
        class="flex gap-3 break-inside-avoid scroll-mt-40 rounded p-2 -m-2 transition-colors target:bg-primary-50 dark:target:bg-primary-950/50"
      >
        <span class="text-gray-500 font-mono text-sm shrink-0">
          [{{ idx + 1 }}]
        </span>

        <div class="flex-1 text-sm">
          <div class="flex items-center gap-2 mb-1">
            <UBadge
              v-if="ref.credibility"
              :label="credibilityLabels[ref.credibility]"
              :color="credibilityColors[ref.credibility]"
              variant="soft"
              size="xs"
            />
            <span class="text-gray-500">{{ ref.date }}</span>
          </div>

          <div class="leading-relaxed">
            <span
              v-if="ref.author"
              class="font-medium text-gray-900 dark:text-white"
            >
              {{ ref.author }}.
            </span>
            <span class="italic text-gray-800 dark:text-gray-200">
              {{ ref.title }}.
            </span>
            <span
              v-if="ref.description"
              class="text-gray-600 dark:text-gray-400"
            >
              {{ ref.description }}
            </span>
          </div>

          <!-- ✅ Open PDF in new tab (user can download from browser if desired) -->
          <a
            v-if="ref.pdf"
            :href="ref.pdf"
            target="_blank"
            class="inline-flex items-center gap-1 text-primary hover:underline mt-1 text-xs"
          >
            View PDF
            <UIcon
              name="i-heroicons-arrow-top-right-on-square"
              class="w-3 h-3"
            />
          </a>
          <a
            v-else-if="ref.url"
            :href="ref.url"
            target="_blank"
            class="inline-flex items-center gap-1 text-primary hover:underline mt-1 text-xs"
          >
            View Source
            <UIcon
              name="i-heroicons-arrow-top-right-on-square"
              class="w-3 h-3"
            />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
