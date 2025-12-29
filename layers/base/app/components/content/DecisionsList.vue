<script setup lang="ts">
const { getFounder } = useContentCache();
const { data: founderData } = await getFounder();

const { data: decisions, pending } = useAsyncData('decisions-list', () =>
  queryCollection('pages')
    .select('path', 'label', 'date', 'title', 'description', 'image')
    .where('path', 'LIKE', '/decisions/%')
    .where('label', 'IS NOT NULL')
    .order('date', 'DESC')
    .all(),
);

const authors = computed(() => [
  {
    name: `${founderData.value?.given_name} ${founderData.value?.surname}`,
    avatar: founderData.value?.avatar,
    to: founderData.value?.links?.find((link) => link.label === 'GitHub')?.url,
    target: '_blank',
  },
]);

const showScrollTop = ref(false);

onMounted(() => {
  const handleScroll = () => {
    showScrollTop.value = window?.scrollY > 500;
  };
  window?.addEventListener('scroll', handleScroll);
  onUnmounted(() => window?.removeEventListener('scroll', handleScroll));
});

const scrollToTop = () => {
  window?.scrollTo({ top: 0, behavior: 'smooth' });
};
</script>

<template>
  <UPageBody>
    <UContainer>
      <div v-if="pending" class="space-y-12">
        <div v-for="i in 3" :key="i" class="space-y-4">
          <USkeleton class="h-8 w-1/3" />
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-5/6" />
          <USkeleton class="h-64 w-full rounded-lg" />
        </div>
      </div>

      <UEmpty
        v-else-if="!decisions?.length"
        title="No decisions yet"
        description="Check back soon for strategic decisions and learnings."
        icon="i-lucide-inbox"
      />

      <UChangelogVersions v-else :indicator="false">
        <UChangelogVersion
          v-for="decision in decisions"
          :key="decision.label"
          :title="decision.title"
          :description="decision.description"
          :authors="authors"
          :image="decision.image"
          :date="decision.date"
          :to="decision.path"
          :badge="undefined"
          :ui="{
            indicator:
              'hidden lg:flex lg:sticky lg:top-(--ui-header-height) pt-6 -mt-6 relative flex-col items-end gap-3 min-w-[140px] mr-4',
            title: 'text-3xl font-bold pb-4',
            container: 'px-8',
          }"
        >
          <template #indicator>
            <div class="flex flex-col items-end gap-3 text-right">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-calendar" class="size-3.5 text-muted" />
                <NuxtTime
                  class="text-xs text-muted font-medium tracking-wide"
                  locale="en-US"
                  :datetime="decision.date"
                  year="numeric"
                  month="short"
                  day="numeric"
                />
              </div>
              <UBadge variant="subtle">
                {{ decision.label }}
              </UBadge>
            </div>
          </template>
        </UChangelogVersion>
      </UChangelogVersions>
    </UContainer>

    <UButton
      v-if="showScrollTop"
      icon="i-lucide-arrow-up"
      size="xl"
      variant="outline"
      color="neutral"
      aria-label="Scroll to top"
      class="fixed bottom-8 right-8 z-50 shadow-lg"
      @click="scrollToTop"
    />
  </UPageBody>
</template>
