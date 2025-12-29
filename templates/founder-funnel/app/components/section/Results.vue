<script setup lang="ts">
const props = defineProps<{
  title?: string;
  description?: string;
  items?: Array<{
    quote: string;
    name: string;
    role: string;
    avatarUrl?: string;
    link?: string;
    highlight?: boolean;
  }>;
  cta?: {
    headline?: string;
    message?: string;
    label?: string;
    to?: string;
  };
  // Fallback for migration
  intro?: { title: string; description: string };
}>();

const testimonials = computed(() => props.items || []);
</script>

<template>
  <SectionWrapper id="results" has-bottom>
    <SectionHeader
      :title="title || intro?.title"
      :description="description || intro?.description"
    />

    <UPageColumns class="mt-12 sm:mt-16">
      <UPageCard
        v-for="(testimonial, index) in testimonials"
        :key="index"
        :description="testimonial.quote"
        :ui="{
          description: 'text-lg italic text-neutral-300 leading-relaxed',
        }"
      >
        <template #footer>
          <div class="flex items-center gap-3">
            <UAvatar
              v-if="testimonial.avatarUrl"
              :src="testimonial.avatarUrl"
              :alt="testimonial.name"
            />
            <div>
              <div class="font-medium text-white">{{ testimonial.name }}</div>
              <div class="text-sm text-neutral-500">{{ testimonial.role }}</div>
            </div>
          </div>
        </template>
      </UPageCard>
    </UPageColumns>

    <template #bottom>
      <NavCta v-if="cta" :title="cta.headline" :description="cta.message">
        <template #links>
          <UButton
            v-if="cta.label && cta.to"
            :label="cta.label"
            :to="cta.to"
            size="xl"
            color="primary"
            variant="solid"
            trailing
          />
        </template>
      </NavCta>
    </template>
  </SectionWrapper>
</template>
