<!-- app/components/content/CaseStudy.vue -->
<script setup lang="ts">
interface Client {
  name: string;
  role: string;
  company: string;
  avatar?: string;
  website?: string;
}

interface Lesson {
  text: string;
}

interface Props {
  client: Client;
  challenge: string;
  solution: string;
  quote: string;
  lessons: Lesson[];
  partnerLogos?: Array<{ src: string; alt: string }>;
}

const props = defineProps<Props>();
</script>

<template>
  <section class="my-12 lg:my-16">
    <!-- Main Content -->
    <div class="max-w-4xl space-y-6">
      <!-- Client Card + Quote (Merged) -->
      <div
        class="p-5 rounded-lg bg-muted/10 border border-neutral-800 space-y-4"
      >
        <!-- Avatar + Info -->
        <div class="flex items-start gap-4">
          <NuxtImg
            v-if="client.avatar"
            :src="client.avatar"
            :alt="client.name"
            class="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
          />
          <div class="flex-1">
            <h3 class="text-lg font-bold text-highlighted">
              {{ client.name }}
            </h3>
            <p class="text-sm text-muted">
              {{ client.role }} • {{ client.company }}
            </p>
          </div>
        </div>

        <!-- Quote -->
        <div class="pt-3 border-t border-neutral-800/50">
          <p class="text-base italic text-highlighted leading-relaxed">
            "{{ quote }}"
          </p>
        </div>

        <!-- Trust Signals -->
        <div v-if="partnerLogos?.length" class="flex items-center gap-3 pt-2">
          <span class="text-xs text-muted">Working with:</span>
          <div class="flex gap-3">
            <NuxtImg
              v-for="logo in partnerLogos"
              :key="logo.alt"
              :src="logo.src"
              :alt="logo.alt"
              class="h-4 opacity-60"
            />
          </div>
        </div>

        <!-- Visit Website -->
        <div v-if="client.website" class="flex justify-end">
          <UButton
            :to="client.website"
            label="Visit Website"
            variant="link"
            color="primary"
            size="sm"
            trailing-icon="i-lucide-external-link"
            target="_blank"
          />
        </div>
      </div>

      <!-- Challenge + Solution (Side-by-side on desktop) -->
      <div class="grid md:grid-cols-2 gap-4">
        <!-- Challenge -->
        <div class="p-4 space-y-2">
          <h3 class="text-base font-bold text-error">The Challenge</h3>
          <p class="text-sm text-muted leading-relaxed">{{ challenge }}</p>
        </div>

        <!-- Solution -->
        <div class="p-4 space-y-2">
          <h3 class="text-base font-bold text-success">The Solution</h3>
          <p class="text-sm text-muted leading-relaxed">{{ solution }}</p>
        </div>
      </div>

      <!-- Mentor's Playbook (Condensed) -->
      <div class="p-5">
        <div class="space-y-3">
          <h3 class="text-lg font-bold flex items-center gap-2">
            <UIcon name="i-lucide-book-open" class="size-4" />
            Why This Worked
          </h3>
          <ul class="space-y-2">
            <li
              v-for="(lesson, index) in lessons"
              :key="index"
              class="flex items-start gap-2 text-sm text-muted leading-relaxed"
            >
              <span class="font-bold shrink-0">{{ index + 1 }}.</span>
              <span>{{ lesson.text }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
