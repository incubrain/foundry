<!-- app/components/convert/Booking.vue -->
<script setup lang="ts">
interface Props {
  url: string;
  title: string;
  price: string;
  originalPrice?: string;
  priceNote?: string;
  description: string;
  badge?: string;
  location: string;
  buttonLabel?: string;
  buttonVariant?: 'solid' | 'outline' | 'soft' | 'subtle';
  buttonColor?: 'primary' | 'secondary' | 'neutral';
  highlighted?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  buttonLabel: 'Book Session',
  buttonVariant: 'solid',
  buttonColor: 'primary',
  highlighted: false,
});

const { trackEvent } = useEvents();

const handleClick = () => {
  trackEvent({
    id: `booking_card_click_${props.location}`,
    type: 'cta_click',
    location: props.location,
    action: 'click',
    target: props.url,
    data: {
      ctaType: 'booking_card',
      price: props.price,
      title: props.title,
    },
  });
};

const cardClasses = computed(() => [
  'relative rounded-xl p-8 backdrop-blur-sm transition-all duration-300 h-full',
  props.highlighted
    ? 'border-2 border-primary/40 bg-primary/5 hover:border-primary/60 hover:bg-primary/10'
    : 'border border-neutral-800 bg-muted/30 hover:border-neutral-700 hover:bg-muted/40',
]);
</script>

<template>
  <!-- Wrapper for badge positioning -->
  <div class="relative pt-4 lg:pt-0">
    <!-- Badge (positioned outside card) -->
    <div v-if="badge" class="absolute top-0 left-6 z-10">
      <UBadge :label="badge" />
    </div>

    <!-- Card -->
    <div :class="cardClasses">
      <div class="space-y-4">
        <!-- Price -->
        <div class="flex items-baseline">
          <span class="text-4xl font-bold text-highlighted">{{ price }}</span>
          <span
            v-if="originalPrice"
            class="text-lg text-muted pl-3 line-through"
          >
            {{ originalPrice }}
          </span>
          <span class="text-sm text-muted">{{ priceNote || '/month' }}</span>
        </div>

        <!-- Title -->
        <h3 class="text-2xl font-bold text-highlighted">{{ title }}</h3>

        <!-- Description -->
        <p class="text-muted">{{ description }}</p>

        <!-- CTA Button -->
        <div class="pt-4">
          <UButton
            :to="url"
            :label="buttonLabel"
            :variant="buttonVariant"
            :color="buttonColor"
            size="xl"
            block
            leading-icon="i-lucide-calendar"
            target="_blank"
            rel="noopener noreferrer"
            @click="handleClick"
          />
        </div>
      </div>
    </div>
  </div>
</template>
