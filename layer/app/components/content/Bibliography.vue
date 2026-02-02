<!-- components/Bibliography.vue -->
<script setup lang="ts">
const route = useRoute();
const { citations, allRefs } = useCitations();

const sortedRefs = computed(() => {
  if (!allRefs.value?.length || !citations.value.length) {
    return [];
  }

  return citations.value
    .map((id) => allRefs.value.find((r: any) => r.id === id))
    .filter(Boolean);
});
</script>

<template>
  <div
    v-if="sortedRefs.length"
    :key="`bibliography${route.path}`"
    class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800"
  >
    <div class="space-y-4 lg:columns-2 lg:gap-8">
      <div
        v-for="(ref, idx) in sortedRefs"
        :key="ref.id"
        class="flex gap-3 break-inside-avoid scroll-mt-40 rounded p-2 -m-2 transition-colors target:bg-primary-50 dark:target:bg-primary-950/50"
      >
        <span class="text-gray-500 font-mono text-sm shrink-0">
          [{{ idx + 1 }}]
        </span>

        <div class="flex-1 text-sm">
          <div class="flex items-center gap-2 mb-1">
            <UBadge
              v-if="ref.credibilityScore"
              :label="ref.credibilityScore"
              color="primary"
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
