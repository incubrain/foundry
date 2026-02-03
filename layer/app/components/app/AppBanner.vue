<script setup lang="ts">
import type { BannerProps } from '@nuxt/ui'

const banner = inject<Ref<BannerProps | undefined>>('banner_config')

const bannerProps = computed<BannerProps>(() => {
  if (!banner?.value || Object.keys(banner.value).length === 0) {
    return {}
  }

  return banner.value as BannerProps
})

const shouldShowBanner = computed(() => {
  return bannerProps.value && Object.keys(bannerProps.value).length > 0
})
</script>

<template>
  <UBanner
    v-if="shouldShowBanner"
    v-bind="bannerProps"
  />
</template>
