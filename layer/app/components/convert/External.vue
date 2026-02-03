<!-- app/components/convert/External.vue -->
<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'
import type { OfferId } from '#shared/types/events'

interface Props {
  // Functional
  to: string
  type: OfferId
  location: string

  // Content
  label?: string
  icon?: string

  // Card specific (type='booking' usually)
  title?: string
  description?: string
  price?: string
  originalPrice?: string
  priceNote?: string
  badge?: string

  // Display
  variant?: 'button' | 'card'
  highlighted?: boolean // For card variant

  // Button Styling (passed to UButton)
  buttonSize?: ButtonProps['size']
  buttonVariant?: ButtonProps['variant']
  buttonColor?: ButtonProps['color']
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'button',
  buttonSize: 'xl',
  buttonVariant: 'solid',
  buttonColor: 'primary',
  highlighted: false,
  label: undefined,
  icon: undefined,
})

// Default labels/icons based on type
const defaultContent = computed(() => {
  switch (props.type) {
    case 'payment':
      return { label: 'Purchase Now', icon: 'i-lucide-credit-card' }
    case 'booking':
      return { label: 'Book Session', icon: 'i-lucide-calendar' }
    case 'apply':
      return { label: 'Apply Now', icon: 'i-lucide-send' }
    default:
      return { label: 'Go', icon: 'i-lucide-arrow-right' }
  }
})

const displayLabel = computed(() => props.label || defaultContent.value.label)
const displayIcon = computed(() => props.icon || defaultContent.value.icon)

const { trackEvent } = useEvents()

const handleClick = () => {
  trackEvent({
    id: `offer_click_${props.type}_${props.location}`,
    type: 'offer_click',
    target: `${props.type}_external`,
  })
}

// Card styling
const cardClasses = computed(() => [
  'relative rounded-xl p-8 backdrop-blur-sm transition-all duration-300 h-full',
  props.highlighted
    ? 'border-2 border-primary/40 bg-primary/5 hover:border-primary/60 hover:bg-primary/10'
    : 'border border-neutral-800 bg-muted/30 hover:border-neutral-700 hover:bg-muted/40',
])
</script>

<template>
  <!-- Button Variant -->
  <div
    v-if="variant === 'button'"
    class="w-full space-y-3"
  >
    <UButton
      :to="to"
      :label="displayLabel"
      :trailing-icon="displayIcon"
      :size="buttonSize"
      :variant="buttonVariant"
      :color="buttonColor"
      :block="block"
      target="_blank"
      rel="noopener noreferrer"
      @click="handleClick"
    />

    <!-- Optional price/note below button (from Payment.vue logic) -->
    <div
      v-if="price || priceNote"
      class="text-center space-y-1"
    >
      <p
        v-if="price"
        class="text-sm font-semibold text-highlighted"
      >
        {{ price }}
      </p>
      <p
        v-if="priceNote"
        class="text-xs text-muted"
      >
        {{ priceNote }}
      </p>
    </div>
  </div>

  <!-- Card Variant (from Booking.vue logic) -->
  <div
    v-else-if="variant === 'card'"
    class="relative pt-4 lg:pt-0 h-full"
  >
    <!-- Badge -->
    <div
      v-if="badge"
      class="absolute top-0 left-6 z-10"
    >
      <UBadge :label="badge" />
    </div>

    <!-- Card Content -->
    <div :class="cardClasses">
      <div class="space-y-4 flex flex-col h-full">
        <!-- Header: Price & Title -->
        <div class="space-y-4 grow">
          <div
            v-if="price"
            class="flex items-baseline"
          >
            <span class="text-4xl font-bold text-highlighted">{{ price }}</span>
            <span
              v-if="originalPrice"
              class="text-lg text-muted pl-3 line-through"
            >
              {{ originalPrice }}
            </span>
            <span
              v-if="priceNote"
              class="text-sm text-muted ml-2"
            >{{
              priceNote
            }}</span>
          </div>

          <h3
            v-if="title"
            class="text-2xl font-bold text-highlighted"
          >
            {{ title }}
          </h3>
          <p
            v-if="description"
            class="text-muted"
          >
            {{ description }}
          </p>
        </div>

        <!-- CTA -->
        <div class="pt-4">
          <UButton
            :to="to"
            :label="displayLabel"
            :variant="buttonVariant"
            :color="buttonColor"
            :size="buttonSize"
            :trailing-icon="displayIcon"
            block
            target="_blank"
            rel="noopener noreferrer"
            @click="handleClick"
          />
        </div>
      </div>
    </div>
  </div>
</template>
