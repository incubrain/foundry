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
  options: BookingOption[];
}

withDefaults(defineProps<Props>(), {});
</script>

<template>
  <section class="py-6 lg:py-12">
    <div class="max-w-5xl mx-auto space-y-8">
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
