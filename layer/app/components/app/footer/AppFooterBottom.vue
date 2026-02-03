<script setup lang="ts">
import type { FooterConfig } from '#navigation'

const site = inject<any>('site_config')
const footerData = inject<Ref<FooterConfig>>('navigation_footer')

const currentYear = new Date().getFullYear()

const foundingYear = computed(() => site.value?.business?.foundingYear)
const legalName = computed(() => site.value?.business?.legalName)
const credits = computed(() => site.value?.credits)

const bottomLinks = computed(() => footerData?.value?.bottom ?? [])

const copyrightYear = computed(() => {
  if (!foundingYear.value) {
    return `${currentYear}`
  }

  return foundingYear.value === currentYear
    ? `${currentYear}`
    : `${foundingYear.value} - ${currentYear}`
})

// Foundry branding
const appConfig = useAppConfig()
const foundry = computed(() => appConfig.foundry as { version: string, url: string } | undefined)

const { trackEvent } = useEvents()
const handleFoundryClick = () => {
  trackEvent({
    id: 'foundry_click',
    type: 'offer_click',
    action: 'click',
    location: 'footer',
    target: 'foundry_external',
  })
}
</script>

<template>
  <UContainer
    class="flex flex-col gap-4 md:flex-row justify-between w-full items-center"
  >
    <p
      v-if="credits"
      class="text-sm text-muted whitespace-nowrap"
    >
      {{ credits }}
    </p>

    <p
      v-else
      class="text-sm text-muted whitespace-nowrap"
    >
      © {{ copyrightYear }} {{ legalName }}
    </p>

    <div
      v-if="bottomLinks.length"
      class="flex items-center gap-3"
    >
      <UButton
        v-for="link in bottomLinks"
        :key="link.to"
        :to="link.to"
        variant="link"
        size="sm"
        color="neutral"
      >
        {{ link.label }}
      </UButton>
    </div>

    <NuxtLink
      v-if="foundry"
      :to="foundry.url"
      target="_blank"
      rel="noopener noreferrer"
      class="text-xs text-muted hover:text-default transition-colors"
      @click="handleFoundryClick"
    >
      Built with @incubrain/foundry{{ foundry.version ? ` v${foundry.version}` : '' }}
    </NuxtLink>
  </UContainer>
</template>
