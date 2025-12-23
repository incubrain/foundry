<!-- app/components/content/FounderBio.vue -->
<script setup lang="ts">
interface Section {
  items: string[];
}

interface Props {
  name: string;
  intro: string;
  avatar?: string;
  sections: Section[];
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

      <!-- Dynamic Sections -->
      <div v-for="(section, index) in sections" :key="index" class="space-y-3">
        <h3 class="text-lg font-bold text-highlighted">{{ section.title }}</h3>
        <ul class="space-y-2 pl-1">
          <li
            v-for="(item, i) in section.items"
            :key="i"
            class="flex items-start gap-2 text-muted"
          >
            <span class="text-primary mt-1">•</span>
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
