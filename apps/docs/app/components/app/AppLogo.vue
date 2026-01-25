<script setup lang="ts">
export interface AppLogoProps {
  title?: string;
}

const logo = useAppConfig().logo;

defineProps<AppLogoProps>();
</script>

<template>
  <div class="flex items-center">
    <UColorModeImage
      v-if="logo?.dark || logo?.light"
      :light="logo?.light || logo?.dark"
      :dark="logo?.dark || logo?.light"
      :alt="logo?.alt || title"
      class="h-6 w-auto shrink-0 rounded-full"
    />
    <span v-if="title" class="pl-1">
      {{ title }}
    </span>
  </div>
</template>
