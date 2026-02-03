<script setup lang="ts">
interface CardContent {
  title: string
  description: string
  cta: {
    label: string
    to: string
    icon?: string
  }
}

interface Props {
  items?: CardContent[]
}

defineProps<Props>()
</script>

<template>
  <div class="grid md:grid-cols-2 gap-8">
    <UCard
      v-for="item in items"
      :key="`item-${item.title}`"
      :ui="{
        root: 'transition-colors',
        body: 'p-0 sm:p-0',
      }"
    >
      <template #header>
        <h3 class="text-xl font-semibold">
          {{ item.title }}
        </h3>
      </template>

      <NuxtImg
        src="https://picsum.photos/500/500"
        class="w-full h-full object-cover aspect-square"
      />

      <template #footer>
        <MDC :value="item.description" />
        <UButton
          :label="item.cta.label"
          :to="item.cta.to"
          :trailing-icon="item.cta.icon"
          variant="outline"
          block
          class="mt-6"
        />
      </template>
    </UCard>
  </div>
</template>
