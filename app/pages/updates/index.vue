<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui';

const { getFounder } = useContentCache();
const { data: founderData } = await getFounder();

const { data: page } = await useAsyncData('updates-page', () =>
  queryCollection('pages').path('/updates').first(),
);

const { data: updates, pending } = useAsyncData('updates-list', () =>
  queryCollection('pages')
    .select('path', 'label', 'date', 'title', 'description', 'image')
    .where('path', 'LIKE', '/updates/%')
    .where('label', 'IS NOT NULL')
    .order('date', 'DESC')
    .all(),
);

useHead({
  title: page.value?.title || 'Updates',
  meta: [
    {
      name: 'description',
      content:
        page.value?.description || 'Product updates and strategic decisions.',
    },
  ],
});

const authors = [
  {
    name: `${founderData.value?.given_name} ${founderData.value?.surname}`,
    avatar: founderData.value?.avatar,
    to: founderData.value?.links?.find((link) => link.label === 'GitHub')?.url,
    target: '_blank',
  },
];

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
  <UPage>
    <UPageHero
      icon="i-lucide-lightbulb"
      :title="page?.title"
      :description="page?.description"
      headline="Think different, ship faster"
      class="bg-none!"
    >
      <template #body>
        <div
          class="absolute top-0 inset-0 bg-grid-white pointer-events-none -z-10"
        />

        <ValuesAccordion />

        <div class="flex flex-col items-center gap-4 py-8">
          <span class="text-sm font-medium text-muted">Follow Our Journey</span>
          <ConvertSocial
            location="updates-hero"
            size="lg"
            variant="ghost"
            color="neutral"
            :rounded="false"
            gap="normal"
          />
        </div>
      </template>
    </UPageHero>

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
          v-else-if="!updates?.length"
          title="No updates yet"
          description="Check back soon for product updates and strategic decisions."
          icon="i-lucide-inbox"
        />

        <UChangelogVersions v-else :indicator="false">
          <UChangelogVersion
            v-for="update in updates"
            :key="update.label"
            :title="update.title"
            :description="update.description"
            :authors="authors"
            :image="update.image"
            :date="update.date"
            :to="update.path"
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
                    :datetime="update.date"
                    year="numeric"
                    month="short"
                    day="numeric"
                  />
                </div>
                <UBadge variant="subtle">
                  {{ update.label }}
                </UBadge>
              </div>
            </template>
          </UChangelogVersion>
        </UChangelogVersions>
      </UContainer>
    </UPageBody>

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
  </UPage>
</template>

<style scoped>
.bg-grid-white {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 60px 60px;
}
</style>
