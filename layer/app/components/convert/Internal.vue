<!-- app/components/convert/Internal.vue -->
<script setup lang="ts">
import type { ButtonProps, PageCardProps } from '@nuxt/ui'
import type { OfferId } from '#shared/types/events'

interface Props {
  // Option 1: Query by slug
  offerSlug?: OfferId

  // Option 2: Explicit props (overrides query)
  to?: string
  label?: string
  icon?: string

  // Display variant
  variant?: 'button' | 'card'

  // Button styling
  size?: ButtonProps['size']
  block?: boolean
  color?: ButtonProps['color']
  buttonVariant?: ButtonProps['variant']

  // Card content (only used when variant="card")
  description?: string
  cardVariant?: PageCardProps['variant']
  spotlight?: PageCardProps['spotlight']

  // Required
  location: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'button',
  color: 'primary',
  buttonVariant: 'solid',
  size: 'md',
})

// 🎯 Use composable
const { getOffer } = useContentCache()
const { data: offer } = props.offerSlug
  ? await getOffer(props.offerSlug)
  : { data: ref(null) }

// Compute final values
const cta = computed(() => ({
  to: props.to || (props.offerSlug ? `/offers/${props.offerSlug}` : '#'),
  label:
    props.label || offer.value?.ctaLabel || offer.value?.title || 'Learn More',
  icon: props.icon || offer.value?.icon || 'i-lucide-arrow-right',
  description: props.description || offer.value?.description,
}))

const { trackEvent } = useEvents()

const handleClick = async () => {
  await trackEvent({
    id: `offer_click_${props.offerSlug}_${props.location}`,
    type: 'offer_click',
    target: `${props.offerSlug}_internal`,
  })
}
</script>

<template>
  <div class="w-full">
    <!-- Button Variant -->
    <UButton
      v-if="variant === 'button'"
      :label="cta.label"
      :trailing-icon="cta.icon"
      :color="color"
      :variant="buttonVariant"
      :size="size"
      :block="block"
      :to="cta.to"
      @click="handleClick"
    />

    <!-- Card Variant -->
    <UPageCard
      v-else-if="variant === 'card'"
      :title="cta.label"
      :description="cta.description"
      :to="cta.to"
      :variant="cardVariant"
      :spotlight="spotlight"
      :spotlight-color="color"
      @click="handleClick"
    >
      <template
        v-if="cta.icon"
        #trailing
      >
        <UIcon
          :name="cta.icon"
          class="size-5 text-secondary"
        />
      </template>
    </UPageCard>
  </div>
</template>
