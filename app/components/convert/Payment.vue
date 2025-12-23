<script setup lang="ts">
interface Props {
  url: string;
  label?: string;
  price?: string;
  note?: string;
  location: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'solid' | 'outline' | 'soft' | 'subtle';
  color?: 'primary' | 'secondary' | 'neutral';
  block?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Purchase Now',
  size: 'xl',
  variant: 'solid',
  color: 'primary',
  block: false,
});

const { trackEvent } = useEvents();

const handleClick = () => {
  trackEvent({
    id: `payment_click_${props.location}`,
    type: 'cta_click',
    location: props.location,
    action: 'click',
    target: props.url,
    data: {
      ctaType: 'payment',
      price: props.price,
    },
  });
};
</script>

<template>
  <div class="space-y-3">
    <UButton
      :to="url"
      :label="label"
      :size="size"
      :variant="variant"
      :color="color"
      :block="block"
      leading-icon="i-lucide-credit-card"
      target="_blank"
      rel="noopener noreferrer"
      @click="handleClick"
    />
    
    <div v-if="price || note" class="text-center space-y-1">
      <p v-if="price" class="text-sm font-semibold text-highlighted">
        {{ price }}
      </p>
      <p v-if="note" class="text-xs text-muted">
        {{ note }}
      </p>
    </div>
  </div>
</template>
