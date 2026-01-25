<!-- apps/docs/app/components/content/CaseStudy.vue -->
<script setup lang="ts">
interface Client {
  name: string;
  role: string;
  company: string;
  avatar?: string;
  website?: string;
  action?: string;
}

interface Props {
  client: Client;
  quote: string;
  partner?: {
    label?: string;
    logos?: Array<{ src: string; alt: string }>;
  };
}

const props = defineProps<Props>();
</script>

<template>
  <section class="my-12 lg:my-16">
    <div class="max-w-4xl space-y-6">
      <div
        class="p-5 rounded-lg bg-muted/10 border border-neutral-800 space-y-4"
      >
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
        <div v-if="partner?.logos?.length" class="flex items-center gap-3 pt-2">
          <span class="text-xs text-muted">{{ partner?.label }}</span>
          <div class="flex gap-3">
            <NuxtImg
              v-for="logo in partner?.logos"
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
            :label="client.action || 'Visit Website'"
            variant="link"
            color="primary"
            size="sm"
            trailing-icon="i-lucide-external-link"
            target="_blank"
          />
        </div>
      </div>
    </div>
  </section>
</template>
