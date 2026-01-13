<script setup lang="ts">
const { citations } = useCitations();

// Query references data
const { data: allRefs } = await useAsyncData('references-data', () =>
  queryCollection('references').all(),
);

// Filter and sort references based on citation order
const sortedRefs = computed(() => {
  if (!allRefs.value || !citations.value.length) return [];

  return citations.value
    .map((id) => allRefs.value.find((r: any) => r.stem === id))
    .filter(Boolean);
});

console.log('CITE:REFS', citations.value, allRefs.value, sortedRefs.value);

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
</script>

<template>
  <div
    v-if="sortedRefs.length"
    class="bibliography mt-12 pt-8 border-t border-gray-200 dark:border-gray-800"
  >
    <h2 class="text-2xl font-bold mb-6 prose">References</h2>

    <div class="space-y-4">
      <div
        v-for="(ref, idx) in sortedRefs"
        :id="`ref-${ref.id}`"
        :key="ref.id"
        class="flex gap-3"
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

          <a
            v-if="ref.url"
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
