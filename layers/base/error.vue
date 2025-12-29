<!-- error.vue -->
<script setup lang="ts">
import type { NuxtError } from '#app';

defineProps({
  error: Object as () => NuxtError,
});

// {UX}: redirect should be dynamic based on current path segments
const handleError = () => clearError({ redirect: '/' });
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <UPageCard
      variant="naked"
      class="w-full max-w-2xl"
      :ui="{
        wrapper: 'items-center',
        root: 'flex flex-col items-center text-center',
        footer: 'flex items-center text-center justify-center w-full gap-2',
        header: 'flex flex-col items-center text-center space-y-4 w-full',
      }"
    >
      <template #header>
        <UIcon name="i-lucide-circle-alert" class="size-8 text-error" />
        <div class="w-full">
          <h1 class="text-4xl font-bold">
            {{ error?.statusCode || 500 }}
          </h1>
          <h2 class="text-xl text-muted wrap-break-word">
            {{ error?.statusMessage || 'Error' }}
          </h2>
        </div>
      </template>

      <p class="lg:text-lg wrap-break-word w-full">
        {{ error?.message || 'An unexpected error occurred' }}
      </p>

      <template #footer>
        <UButton color="primary" size="lg" @click="handleError">
          Go Home
        </UButton>
      </template>
    </UPageCard>
  </div>
</template>

<style scoped>
/* Ensure long words break properly */
.overflow-wrap-anywhere {
  overflow-wrap: anywhere;
  word-break: break-word;
}
</style>
