<!-- components/nav/Banner.vue -->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    sticky?: boolean;
    title?: string;
    offerSlug?: string;
    to?: string;
    label?: string;
    icon?: string;
  }>(),
  {
    sticky: true,
    title: 'Limited spots available',
    offerSlug: 'mentorship',
  },
);

// 🎯 Use composable
const { getOffer } = useContentCache();
const { data: offer } = props.offerSlug
  ? await getOffer(props.offerSlug)
  : { data: ref(null) };

const cta = computed(() => ({
  to: props.to || (props.offerSlug ? `/offers/${props.offerSlug}` : '#'),
  label:
    props.label || offer.value?.ctaLabel || offer.value?.title || 'Learn More',
  icon: props.icon || offer.value?.icon || 'i-lucide-arrow-right',
}));

const bannerClasses = computed(() => ({
  'fixed top-0 z-50': props.sticky,
  'relative': !props.sticky,
}));

const { trackEvent } = useEvents();

const handleClick = () => {
  trackEvent({
    id: `offer_click_${props.offerSlug}_banner`,
    type: 'offer_click',
    target: 'service_internal',
  });
};
</script>

<template>
  <UBanner
    :title="title"
    :class="[bannerClasses, $attrs.class]"
    :actions="[
      {
        to: cta.to,
        target: cta.to.startsWith('http') ? '_blank' : undefined,
        label: cta.label,
        trailingIcon: cta.icon,
        color: 'secondary',
        size: 'sm',
        variant: 'ghost',
        onClick: handleClick,
      },
    ]"
    close
    :ui="{
      root: 'hover:bg-default bg-primary-950/60 text-muted h-(--ui-banner-height) backdrop-blur-3xl',
      title: 'text-sm text-muted font-medium truncate pl-3',
      icon: 'size-5 shrink-0 text-error pointer-events-none',
      close: 'text-muted hover:bg-muted cursor-pointer',
    }"
  />
</template>
