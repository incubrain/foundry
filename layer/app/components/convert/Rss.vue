<script setup lang="ts">
import type { SelectMenuProps } from '@nuxt/ui'

interface Props {
  // Feed configuration
  feedPath?: string // e.g., 'decisions', 'blog', 'updates'
  feedUrl?: string // Full URL override (if not using feedPath)

  // Tracking
  location: string

  // UI customization
  size?: SelectMenuProps['size']
  variant?: SelectMenuProps['variant']
  color?: SelectMenuProps['color']
  showLabel?: boolean
  label?: string // Custom label (default: 'RSS')
}

const props = withDefaults(defineProps<Props>(), {
  feedPath: 'decisions', // Default to decisions feed
  size: 'lg',
  variant: 'ghost',
  color: 'neutral',
  showLabel: true,
  label: 'RSS',
})

const config = useRuntimeConfig()
const { trackEvent } = useEvents()
const { copy } = useClipboard()
const toast = useToast()

// Compute final feed URL
const feedUrl = computed(() => {
  if (props.feedUrl) return props.feedUrl
  return `${config.public.siteUrl}/rss/${props.feedPath}`
})

type RSSType
  = | 'feedly'
    | 'inoreader'
    | 'newsblur'
    | 'oldreader'
    | 'xml'
    | 'copy'

const handleRSSClick = (target?: 'internal' | 'external', type?: RSSType) => {
  trackEvent({
    id: `offer_click_rss_${props.location}_${props.feedPath}_${type}`,
    type: 'offer_click',
    target: `rss_${target}`,
  })
}

const copyFeedUrl = async () => {
  await copy(feedUrl.value)
  handleRSSClick('internal', 'copy')

  toast.add({
    title: 'Feed URL Copied',
    description: 'Paste into your RSS reader',
    icon: 'i-lucide-check',
    color: 'success',
  })
}

const handleReaderClick = (url: string, type?: RSSType) => {
  handleRSSClick('external', type)
  window.open(url, '_blank')
}

const actions = computed(() => [
  {
    label: 'Copy Feed URL',
    icon: 'i-lucide-copy',
    click: copyFeedUrl,
  },
  {
    label: 'Open Feed',
    icon: 'i-lucide-external-link',
    click: () => {
      handleRSSClick('internal', 'xml')
      window.open(feedUrl.value, '_blank')
    },
  },
  {
    label: 'Feedly',
    icon: 'i-simple-icons-feedly',
    click: () =>
      handleReaderClick(
        `https://feedly.com/i/subscription/feed/${encodeURIComponent(feedUrl.value)}`,
        'feedly',
      ),
  },
  {
    label: 'Inoreader',
    icon: 'i-simple-icons-inoreader',
    click: () =>
      handleReaderClick(
        `https://www.inoreader.com/?add_feed=${encodeURIComponent(feedUrl.value)}`,
        'inoreader',
      ),
  },
  {
    label: 'NewsBlur',
    icon: 'i-lucide-newspaper',
    click: () =>
      handleReaderClick(
        `https://www.newsblur.com/?url=${encodeURIComponent(feedUrl.value)}`,
        'newsblur',
      ),
  },
  {
    label: 'The Old Reader',
    icon: 'i-lucide-book-open',
    click: () =>
      handleReaderClick(
        `https://theoldreader.com/feeds/subscribe?url=${encodeURIComponent(feedUrl.value)}`,
        'oldreader',
      ),
  },
])

// Handle selection from USelectMenu
const handleSelect = (option: any) => {
  if (option?.click) {
    option.click()
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- RSS Button with Select Menu -->
    <USelectMenu
      :items="actions"
      :search-input="false"
      :variant="variant"
      :color="color"
      :size="size"
      :trailing-icon="showLabel ? 'i-lucide-chevron-down' : ''"
      :ui="{
        base: showLabel
          ? ''
          : `rounded-full flex p-2 bg-${color}/10 hover:bg-${color}/40`,
        content: 'w-full',
        item: 'hover:bg-primary/10',
      }"
      @update:model-value="handleSelect"
    >
      <template #default="{ open }">
        <span
          :aria-label="showLabel ? undefined : 'Subscribe to RSS Feed'"
          :class="{ 'opacity-75': open }"
          class="w-full flex items-center gap-2"
        >
          <UIcon
            name="i-lucide-rss"
            class="text-xl"
          />
          {{ showLabel ? label : undefined }}
        </span>
      </template>

      <template #item="{ item }">
        <UIcon
          :name="item.icon"
          class="w-4 h-4 text-muted"
        />
        <span class="truncate">{{ item.label }}</span>
      </template>
    </USelectMenu>
  </div>
</template>
