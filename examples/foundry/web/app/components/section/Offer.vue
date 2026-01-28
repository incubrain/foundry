<script setup lang="ts">
import { STATUS_ICONS } from '#constants';

const props = defineProps<{
  title?: string;
  description?: string;
  price?: string;
  features?: Array<{ title: string; icon: string }>;
  cta?: {
    label?: string;
    to?: string;
  };
}>();

const { getFounder } = useContentCache();
const { data: founder } = await getFounder();

const transformedFeatures = computed(() => {
  return (props.features || []).map((feature) => ({
    label: feature.title,
    icon:
      STATUS_ICONS[feature.icon as keyof typeof STATUS_ICONS] || feature.icon,
  }));
});

const displayTitle = computed(() => props.title);
const displayDescription = computed(() => props.description);
</script>

<template>
  <SectionWrapper id="offer" has-bottom class="relative">
    <div
      class="absolute top-0 inset-0 bg-grid-white/[0.02] pointer-events-none z-0"
    />
    <div
      class="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <div class="w-[80%] h-[80%] bg-primary-500/10 rounded-full blur-3xl" />
    </div>

    <div
      v-if="displayTitle || displayDescription"
      class="mb-12 text-center relative z-10"
    >
      <SectionHeader :title="displayTitle" :description="displayDescription" />
    </div>

    <div
      class="grid lg:grid-cols-[1fr_400px] gap-8 lg:gap-12 relative z-10 items-start"
    >
      <!-- Founder Column (Left) -->
      <div
        v-if="founder"
        class="flex flex-col items-center lg:items-start gap-6 lg:sticky lg:top-24 lg:self-start"
      >
        <div class="relative group bg-default rounded-full">
          <div
            class="absolute inset-0 bg-linear-to-t from-primary/20 to-transparent blur-xl group-hover:blur-2xl transition-all duration-300"
          />
          <NuxtImg
            :src="founder.avatar.src"
            :alt="founder.avatar.alt"
            class="w-32 h-32 lg:w-40 lg:h-40 object-cover object-top border border-primary/20 shadow-2xl relative z-10 pt-2 rounded-full"
          />
        </div>

        <div class="text-center lg:text-left space-y-1">
          <h3 class="text-xl font-bold text-highlighted">
            {{ founder?.given_name }} {{ founder?.surname }}
          </h3>
          <p class="text-xs uppercase tracking-wider text-muted">
            {{ founder?.role }}
          </p>
        </div>

        <p
          class="text-base max-w-sm text-center lg:text-left lg:text-lg italic text-dimmed leading-relaxed"
        >
          {{ founder?.bio }}
        </p>

        <UButton
          to="/about"
          label="Read My Story"
          color="neutral"
          variant="link"
          trailing-icon="i-lucide-arrow-right"
          class="self-center lg:self-start px-0"
        />
      </div>

      <!-- Offer Column (Right) -->
      <div class="w-full max-w-md mx-auto lg:max-w-none">
        <UPricingPlan
          :title="displayTitle"
          :description="displayDescription"
          :price="price"
          :features="transformedFeatures"
          variant="soft"
          :ui="{
            root: 'bg-muted backdrop-blur-sm',
            features: 'gap-3',
            feature: 'items-center',
            terms: 'w-full',
            featureTitle: 'text-sm leading-tight',
            price: 'text-5xl font-black tracking-tight text-white mb-2',
            billingPeriod: 'text-neutral-400 font-medium',
          }"
        >
          <template #description>
            <!-- Hide default description slot to control layout manually if needed, or rely on prop -->
            <p v-if="displayDescription" class="text-base text-toned">
              {{ displayDescription }}
            </p>
          </template>

          <template #features>
            <ul class="flex flex-col gap-3 flex-1 mt-6 grow-0">
              <li
                v-for="feature in transformedFeatures"
                :key="feature.label"
                class="flex items-center gap-2 min-w-0"
              >
                <UIcon
                  :name="feature.icon"
                  class="size-5 shrink-0 text-primary-400"
                />
                <span class="text-muted text-sm truncate">
                  {{ feature.label }}
                </span>
              </li>
            </ul>
          </template>

          <template #button>
            <div class="pt-4 w-full">
              <UButton
                v-if="cta?.label"
                :label="cta?.label"
                :to="cta?.to"
                size="xl"
                block
                color="primary"
                variant="solid"
              />
            </div>
          </template>
        </UPricingPlan>

        <div class="mt-4 flex flex-col gap-4 justify-center items-center">
          <UBadge variant="soft">OR</UBadge>
          <ConvertExternal
            to="https://github.com/incubrain/foundry"
            label="One Click Deploy"
            icon="i-lucide-rocket"
            location="product-section-alt"
            type="social"
            size="xl"
            block
            variant="button"
            button-variant="outline"
            button-color="secondary"
          />
        </div>
      </div>
    </div>
  </SectionWrapper>
</template>
