<script setup lang="ts">
import type { FooterColumn } from '@nuxt/ui'
import type { FooterConfig, NavigationColumn } from '#navigation'

const footerData = inject<Ref<FooterConfig>>('navigation_footer')

const columns = computed<FooterColumn[]>(() => {
  if (!footerData?.value?.columns?.length) return []

  return footerData.value.columns
    .filter(
      (section): section is NavigationColumn & { children: NonNullable<NavigationColumn['children']> } =>
        Array.isArray(section.children) && section.children.length > 0,
    )
    .map(section => ({
      label: section.label,
      children: section.children.map(child => ({
        label: child.label,
        to: child.to,
        target: child.target,
        ...(child.icon ? { icon: child.icon } : {}),
      })),
    }))
})
</script>

<template>
  <UContainer>
    <UFooterColumns
      v-if="columns.length"
      :columns="columns"
    />
  </UContainer>
</template>
