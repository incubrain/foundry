<!-- app/components/nav/Mobile.vue -->
<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

interface Props {
  navigationItems: NavigationMenuItem[];
}

defineProps<Props>();

const isOpen = defineModel<boolean>('open', { default: false });

const closeMenu = () => {
  isOpen.value = false;
};
</script>

<template>
  <div class="flex flex-col justify-between h-full">
    <nav class="flex flex-col space-y-1">
      <template v-for="item in navigationItems" :key="item.label">
        <ULink
          :to="item.to"
          class="flex items-center space-x-3 px-3 py-3 rounded-lg text-toned hover:text-secondary hover:bg-elevated transition-colors"
          @click="closeMenu"
        >
          <UIcon :name="item.icon" class="size-4" />
          <span class="font-medium">{{ item.label }}</span>
        </ULink>

        <!-- Child Items -->
        <div v-if="item.children" class="pl-4 space-y-1">
          <ULink
            v-for="child in item.children"
            :key="child.label"
            :to="child.to"
            class="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted hover:text-secondary hover:bg-elevated transition-colors"
            @click="closeMenu"
          >
            <UIcon :name="child.icon || 'i-lucide-circle'" class="size-3" />
            <span class="text-sm">{{ child.label }}</span>
          </ULink>
        </div>
      </template>
    </nav>

    <!-- Social Links Only -->
    <div class="border-t border-default pt-4 pb-2">
      <div class="flex justify-center">
        <ConvertSocial
          location="mobile-menu"
          size="lg"
          variant="ghost"
          color="neutral"
          :rounded="false"
          gap="normal"
        />
      </div>
    </div>
  </div>
</template>
