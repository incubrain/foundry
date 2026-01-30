<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

const props = withDefaults(defineProps<{
  label?: string
  size?: ButtonProps['size']
  color?: ButtonProps['color']
  variant?: ButtonProps['variant']
  trailingIcon?: string
  title: string
  description: string
  url?: string
}>(), {
    label: 'Share Page',
    size: 'xl',
    color: 'primary',
    variant: 'subtle',
    trailingIcon: 'i-lucide-share'
})

const selected = ref(undefined)
const copied = ref(false)

// Social media items configuration
const items = computed(() => {
  const baseItems = [
    {
      label: 'Share on Twitter/X',
      icon: 'i-lucide-twitter',
      value: 'twitter'
    },
    {
      label: 'Share on LinkedIn',
      icon: 'i-lucide-linkedin',
      value: 'linkedin'
    },
    {
      label: 'Share on Facebook',
      icon: 'i-lucide-facebook',
      value: 'facebook'
    },
    {
      label: 'Share via Email',
      icon: 'i-lucide-mail',
      value: 'email'
    },
    {
      type: 'separator' 
    },
    {
      label: copied.value ? 'Copied!' : 'Copy Link',
      icon: copied.value ? 'i-lucide-check' : 'i-lucide-link',
      value: 'copy',
      chip: copied.value ? { color: 'success' } : undefined
    }
  ]
  return baseItems
})

// Get the current page URL
const shareUrl = computed(() => {
  if (props.url) return props.url
  if (import.meta.client) {
    return window.location.href
  }
  return ''
})

// Encode text for URLs
const encodeText = (text: string) => encodeURIComponent(text)

// Button label with feedback
const buttonLabel = computed(() => copied.value ? 'Copied!' : props.label)
const buttonColor = computed(() => copied.value ? 'success' : props.color)
const buttonIcon = computed(() => copied.value ? 'i-lucide-check' : props.trailingIcon)

// Handle selection
const handleSelect = (value: string) => {
  const url = shareUrl.value
  const title = encodeText(props.title || '')
  const description = encodeText(props.description || '')
  
  let shareLink = ''
  
  switch (value) {
    case 'twitter':
      shareLink = `https://twitter.com/intent/tweet?text=${title}&url=${encodeText(url)}`
      break
    case 'linkedin':
      shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeText(url)}`
      break
    case 'facebook':
      shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeText(url)}`
      break
    case 'email':
      shareLink = `mailto:?subject=${title}&body=${description}%0A%0A${encodeText(url)}`
      break
    case 'copy':
      copyLink()
      break
  }
  
  if (shareLink) {
    window.open(shareLink, '_blank', 'noopener,noreferrer,width=600,height=600')
  }
  
  // Reset selection
  nextTick(() => {
    selected.value = undefined
  })
}

// Watch for selection changes
watch(selected, (newValue) => {
  if (newValue) {
    handleSelect(newValue)
  }
})

// Copy link to clipboard
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    
    // Reset after 2 seconds
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<template>
  <UPopover>
    <UButton
      :label="buttonLabel"
      :size="size"
      :color="buttonColor"
      :variant="variant"
      :trailing-icon="buttonIcon"
      class="min-w-48"
    />

    <template #content>
      <div class="flex flex-col gap-1 p-2 min-w-48">
        <template v-for="item in items" :key="item.value || item.type">
          <div
            v-if="item.type === 'separator'"
            class="my-1 h-px bg-border"
          />

          <UButton
            v-else
            variant="ghost"
            color="neutral"
            class="justify-start"
            :leading-icon="item.icon"
            @click="handleSelect(item.value ?? '')"
          >
            <span class="flex items-center gap-2">
              {{ item.label }}
              <UBadge
                v-if="item.chip"
                size="xs"
                :color="item.chip.color"
              />
            </span>
          </UButton>
        </template>
      </div>
    </template>
  </UPopover>
</template>

