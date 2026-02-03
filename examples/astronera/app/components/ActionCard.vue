<script setup lang="ts">
defineProps<{
  img: {
    src: string
    alt: string
  }
  cta: {
    label: string
    to: string
    icon?: string
  }
}>()

defineSlots<{
  title(props?: {}): any
  default(props?: {}): any
}>()
</script>

<template>
  <UCard
    :ui="{
      root: 'transition-colors',
      body: 'p-0 sm:p-0',
    }"
  >
    <template #header>
      <h3 class="text-xl font-semibold">
        <slot name="title" />
      </h3>
    </template>
    <NuxtImg
      :src="img.src"
      :alt="img.alt"
      class="w-full aspect-square object-cover"
    />

    <div class="p-4 sm:p-6">
      <slot />
    </div>

    <template #footer>
      <UButton
        class="mt-6"
        variant="outline"
        block
        :label="cta.label"
        :to="cta.to"
        :trailing-icon="cta.icon"
      />
    </template>
  </UCard>
</template>
