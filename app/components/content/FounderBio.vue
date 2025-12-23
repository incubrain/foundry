<!-- app/components/content/FounderBio.vue -->
<script setup lang="ts">
interface Props {
  name: string;
  intro: string;
  avatar?: string;
}

const props = withDefaults(defineProps<Props>(), {
  avatar: undefined,
});
</script>

<template>
  <section class="my-12">
    <!-- Title -->

    <div class="max-w-4xl space-y-8">
      <!-- Intro + Avatar -->
      <div class="flex items-start gap-6">
        <NuxtImg
          v-if="avatar"
          :src="avatar"
          :alt="name"
          class="w-20 h-20 rounded-full object-cover border-2 border-primary/20 shrink-0"
        />
        <div class="flex-1">
          <p class="text-lg text-muted leading-relaxed">{{ intro }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
