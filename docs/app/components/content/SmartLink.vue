<script setup lang="ts">
interface Props {
  to: string
  label?: string
  type?: 'internal' | 'external' | 'policy' | 'research' | 'implementation'
}

const props = defineProps<Props>()

// Auto-detect link type if not specified
const linkType = computed(() => {
  if (props.type) return props.type

  if (props.to.startsWith('http')) return 'external'
  if (props.to.startsWith('/policy')) return 'policy'
  if (props.to.startsWith('/research')) return 'research'
  if (props.to.startsWith('/implementation')) return 'implementation'

  return 'internal'
})

const icon = computed(() => {
  switch (linkType.value) {
    case 'external': return 'i-heroicons-arrow-top-right-on-square'
    case 'policy': return 'i-heroicons-document-text'
    case 'research': return 'i-heroicons-beaker'
    case 'implementation': return 'i-heroicons-wrench-screwdriver'
    default: return 'i-heroicons-link'
  }
})

const color = computed(() => {
  switch (linkType.value) {
    case 'policy': return 'blue'
    case 'research': return 'purple'
    case 'implementation': return 'green'
    default: return 'primary'
  }
})
</script>

<template>
  <NuxtLink
    :to="to"
    :target="linkType === 'external' ? '_blank' : undefined"
    :class="[
      'inline-flex items-center gap-1 text-' + color,
      'hover:underline font-medium'
    ]"
  >
    <slot>{{ label || to }}</slot>
    <UIcon :name="icon" class="w-3.5 h-3.5 opacity-70" />
  </NuxtLink>
</template>
