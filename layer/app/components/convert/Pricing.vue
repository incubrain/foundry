<!-- app/components/convert/Pricing.vue -->
<script setup lang="ts">
interface BookingOption {
  url: string
  title: string
  price: string
  originalPrice?: string
  priceNote?: string // used for billing cycle details in our data
  priceInterval?: string // explicitly passed in markdown
  description: string
  badge?: string
  location: string
  buttonLabel?: string
  buttonVariant?: 'solid' | 'outline' | 'soft' | 'subtle'
  buttonColor?: 'primary' | 'secondary' | 'neutral'
  highlighted?: boolean
  features?: string[] | { title: string, icon: string }[]
}

interface Props {
  options: BookingOption[]
}

defineProps<Props>()
</script>

<template>
  <section class="py-6 lg:py-12">
    <div class="max-w-5xl mx-auto">
      <UPricingPlans scale>
        <UPricingPlan
          v-for="(option, index) in options"
          :key="index"
          :title="option.title"
          :description="option.description"
          :price="option.originalPrice ? option.originalPrice : option.price"
          :discount="option.originalPrice ? option.price : undefined"
          :billing-cycle="option.priceInterval || option.priceNote"
          :features="option.features"
          :highlight="option.highlighted"
          :scale="option.highlighted"
          :badge="option.badge"
        >
          <template #button>
            <ConvertExternal
              :to="option.url"
              :label="option.buttonLabel || 'Book Now'"
              :variant="'button'"
              :button-variant="
                option.buttonVariant || (option.highlighted ? 'solid' : 'soft')
              "
              :button-color="option.buttonColor || 'primary'"
              type="booking"
              :location="option.location"
              block
            />
          </template>
        </UPricingPlan>
      </UPricingPlans>
    </div>
  </section>
</template>
