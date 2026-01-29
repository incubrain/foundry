<script setup lang="ts">
defineProps<{
  title: string;
  icon: string;
}>();
</script>

<template>
  <UCard
    :ui="{
      root: 'bg-muted hover:bg-muted/50 transition-colors h-full',
      body: 'space-y-4 p-0 px-6 sm:px-4 items-start',
      header: 'space-y-2',
    }"
  >
    <template #header>
      <div class="flex items-start gap-4">
        <UIcon :name="icon" class="size-6 text-primary shrink-0" />
        <h3 class="text-lg font-bold text-highlighted">
          {{ title }}
        </h3>
      </div>
    </template>

    <div>
      <slot />
    </div>
  </UCard>
</template>
