<!-- app/components/convert/Multiple.vue -->
<script setup lang="ts">
interface BookingOption {
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

interface Props {
  title?: string;
  description?: string;
  options: BookingOption[];
}

withDefaults(defineProps<Props>(), {
  title: 'Choose Your Format',
  description: undefined,
});
</script>

<template>
  <section class="my-16">
    <div class="max-w-5xl mx-auto space-y-8">
      <!-- Section Header (optional) -->
      <div v-if="title || description" class="text-center space-y-3">
        <h2 v-if="title" class="text-3xl font-bold text-highlighted">
          {{ title }}
        </h2>
        <p v-if="description" class="text-lg text-muted">
          {{ description }}
        </p>
      </div>

      <!-- Booking Cards Grid -->
      <div class="grid md:grid-cols-2 gap-6">
        <ConvertBooking
          v-for="(option, index) in options"
          :key="index"
          v-bind="option"
        />
      </div>
    </div>
  </section>
</template>