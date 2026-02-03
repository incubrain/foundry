<script setup lang="ts">
import type { PagesCollectionItem } from '@nuxt/content'

interface Props {
  // Query parameters
  collectionPath: string // e.g., '/decisions/%', '/blog/%'
  labelField?: keyof PagesCollectionItem // Field to filter by (default: 'label')
  sortField?: keyof PagesCollectionItem // Field to sort by (default: 'date')
  sortOrder?: 'ASC' | 'DESC' // Sort order (default: 'DESC')

  // Display customization
  showAuthor?: boolean // Show author attribution
  showImage?: boolean // Show featured images
  showScrollTop?: boolean // Show scroll-to-top button
  scrollTopThreshold?: number // Scroll threshold for button (default: 500)

  // Empty state
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: string
}

const props = withDefaults(defineProps<Props>(), {
  labelField: 'label',
  sortField: 'date',
  sortOrder: 'DESC',
  showAuthor: true,
  showImage: true,
  showScrollTop: true,
  scrollTopThreshold: 500,
  emptyTitle: 'No items yet',
  emptyDescription: 'Check back soon for updates.',
  emptyIcon: 'i-lucide-inbox',
})

// Author data (only if showAuthor)
const { getFounder } = useContentCache()
const { data: founderData } = props.showAuthor
  ? await getFounder()
  : { data: ref(null) }

const authors = computed(() =>
  props.showAuthor && founderData.value
    ? [
        {
          name: `${founderData.value.given_name} ${founderData.value.surname}`,
          avatar: founderData.value.avatar,
          to: founderData.value.links?.find(link => link.label === 'GitHub')
            ?.url,
          target: '_blank',
        },
      ]
    : [],
)

// Query items
const { data: items, pending } = useAsyncData(
  `changelog-${props.collectionPath}`,
  () => {
    let query = queryCollection('pages')
      .select('path', props.labelField, props.sortField, 'title', 'description')
      .where('path', 'LIKE', props.collectionPath)

    // Add image to select if needed
    if (props.showImage) {
      query = query.select(
        'path',
        props.labelField,
        props.sortField,
        'title',
        'description',
        'image',
      )
    }

    // Filter by label field if it exists
    if (props.labelField) {
      query = query.where(props.labelField, 'IS NOT NULL')
    }

    // Sort
    query = query.order(props.sortField, props.sortOrder)

    return query.all()
  },
)

// Scroll-to-top functionality
const showScrollTop = ref(false)

onMounted(() => {
  if (props.showScrollTop) {
    const handleScroll = () => {
      showScrollTop.value = window?.scrollY > props.scrollTopThreshold
    }
    window?.addEventListener('scroll', handleScroll)
    onUnmounted(() => window?.removeEventListener('scroll', handleScroll))
  }
})

const scrollToTop = () => {
  window?.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <UPageBody>
    <UContainer>
      <!-- Loading state -->
      <div
        v-if="pending"
        class="space-y-12"
      >
        <div
          v-for="i in 3"
          :key="i"
          class="space-y-4"
        >
          <USkeleton class="h-8 w-1/3" />
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-5/6" />
          <USkeleton
            v-if="showImage"
            class="h-64 w-full rounded-lg"
          />
        </div>
      </div>

      <!-- Empty state -->
      <UEmpty
        v-else-if="!items?.length"
        :title="emptyTitle"
        :description="emptyDescription"
        :icon="emptyIcon"
      />

      <!-- Changelog list -->
      <UChangelogVersions
        v-else
        :indicator="false"
      >
        <UChangelogVersion
          v-for="item in items"
          :key="String(item[labelField])"
          :title="item.title"
          :description="item.description"
          :authors="authors"
          :image="showImage ? item.image : undefined"
          :date="String(item[sortField])"
          :to="item.path"
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
              <!-- Date -->
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-calendar"
                  class="size-3.5 text-muted"
                />
                <NuxtTime
                  class="text-xs text-muted font-medium tracking-wide"
                  locale="en-US"
                  :datetime="String(item[sortField])"
                  year="numeric"
                  month="short"
                  day="numeric"
                />
              </div>

              <!-- Badge (label) -->
              <UBadge
                v-if="item[labelField]"
                variant="subtle"
              >
                {{ item[labelField] }}
              </UBadge>
            </div>
          </template>
        </UChangelogVersion>
      </UChangelogVersions>
    </UContainer>

    <!-- Scroll to top button -->
    <UButton
      v-if="showScrollTop && showScrollTop"
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
