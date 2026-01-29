<script setup lang="ts">
interface Item {
  label: string
  description?: string
}

interface Props {
  icon?: string
  title?: string
  items?: Item[]
  color?: 'success' | 'error'
}

const props = withDefaults(defineProps<Props>(), {
  color: 'success'
})
</script>

<template>
  <UCard class="border-none shadow-lg text-left h-full">
    <template #header>
      <div class="flex items-center gap-3">
        <UIcon 
          :name="icon" 
          class="size-7 text-primary shrink-0" 
        />
        <h3 class="text-xl font-bold text-gray-900 dark:text-white">
          {{ title }}
        </h3>
      </div>
    </template>

    <!-- Subtitle slot -->
    <div v-if="$slots.subtitle" class="text-gray-700 dark:text-gray-300 mb-4">
      <slot name="subtitle" />
    </div>

    <!-- Default slot for custom content -->
    <slot />

    <!-- Items list (stays as prop - requires consistent styling) -->
    <div v-if="items?.length" class="space-y-3 mt-4">
      <p 
        v-for="(item, idx) in items" 
        :key="idx"
        class="text-gray-600 dark:text-gray-400"
      >
        <UBadge 
          :label="item.label" 
          :color="color" 
          variant="subtle"
          class="inline-block mr-2"
        />
        {{ item.description }}
      </p>
    </div>

    <!-- Footer slot for alerts or other content -->
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </UCard>
</template>