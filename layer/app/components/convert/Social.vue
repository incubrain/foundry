<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

interface Props {
  location: string
  size?: ButtonProps['size']
  variant?: ButtonProps['variant']
  color?: ButtonProps['color']
  rounded?: boolean
  gap?: 'tight' | 'normal' | 'relaxed'
  showEmail?: boolean // NEW: Show email button
}

const props = withDefaults(defineProps<Props>(), {
  size: 'xl',
  variant: 'subtle',
  color: 'secondary',
  rounded: true,
  gap: 'normal',
  showEmail: false, // Default: don't show email
})

const { getFounder } = useContentCache()
const { data: founder } = await getFounder()
const { trackEvent } = useEvents()

const gapClasses = {
  tight: 'gap-1',
  normal: 'gap-3',
  relaxed: 'gap-4',
}

const handleClick = (platform: string, url: string) => {
  trackEvent({
    id: `offer_click_${props.location}_${platform.toLowerCase()}`,
    type: 'offer_click',
    target: 'social_external',
  })
}

// Email link (if showEmail is true)
const emailLink = computed(() => {
  if (!props.showEmail || !founder.value?.email) return null

  return {
    label: 'Email',
    url: `mailto:${founder.value.email}`,
    icon: 'i-lucide-mail',
  }
})

// Combine email + social links
const allLinks = computed(() => {
  const links = [...(founder.value?.links || [])]

  // Prepend email link if enabled
  if (emailLink.value) {
    links.unshift(emailLink.value)
  }

  return links
})
</script>

<template>
  <div
    v-if="allLinks.length"
    :class="['flex flex-wrap', gapClasses[gap]]"
  >
    <UButton
      v-for="link in allLinks"
      :key="link.url"
      :icon="link.icon"
      :to="link.url"
      :external="!link.url.startsWith('mailto:')"
      :target="link.url.startsWith('mailto:') ? undefined : '_blank'"
      :size="size"
      :variant="variant"
      :color="color"
      :class="[
        rounded ? 'rounded-full text-default' : '',
        size === 'xl' && rounded ? 'p-3' : '',
      ]"
      :aria-label="`${link.label === 'Email' ? 'Email' : 'Visit'} ${founder.given_name}${link.label === 'Email' ? '' : `'s ${link.label}`}`"
      @click="handleClick(link.label, link.url)"
    />
  </div>
</template>
