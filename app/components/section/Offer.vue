<script setup lang="ts">
import { STATUS_ICONS } from '#constants';

interface ProductData {
  title: string;
  description: string;
  price: string;
  features: Array<{ title: string; icon: string }>;
  intro?: { title: string; description: string };
  cta?: any;
}

interface Props {
  data?: ProductData;
}

const props = defineProps<Props>();

const { getFounder } = useContentCache();
const { data: founderData } = await getFounder();

const transformedFeatures = computed(() => {
  if (!props.data?.features) return [];

  return props.data.features.map((feature) => {
    const resolved = STATUS_ICONS[feature.icon] || {
      name: feature.icon,
      class: '',
    };
    return {
      title: feature.title,
      icon: resolved.name,
      class: resolved.class,
    };
  });
});
</script>

<template>
  <SectionWrapper
    id="#offer"
    :intro="data.intro"
    :cta="data.cta"
    class="relative"
  >
    <div
      class="absolute top-0 inset-0 bg-grid-white/[0.02] pointer-events-none z-0"
    />
    <div
      class="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <div class="w-[80%] h-[80%] bg-primary-500/10 rounded-full blur-3xl" />
    </div>

    <div
      class="grid lg:grid-cols-[400px_1fr] gap-8 lg:gap-12 max-w-6xl mx-auto relative z-10 px-4"
    >
      <div
        class="flex flex-col items-center lg:items-start gap-6 lg:sticky lg:top-24 lg:self-start"
      >
        <div class="relative group bg-default rounded-full">
          <div
            class="absolute inset-0 bg-linear-to-t from-primary/20 to-transparent blur-xl group-hover:blur-2xl transition-all duration-300"
          />
          <NuxtImg
            :src="founderData.avatar.src"
            :alt="founderData.avatar.alt"
            class="w-32 h-32 lg:w-40 lg:h-40 object-cover object-top border border-primary/20 shadow-2xl relative z-10 pt-2 rounded-full"
          />
        </div>

        <div class="text-center lg:text-left space-y-1">
          <h3 class="text-xl font-bold text-highlighted">
            {{ founderData?.given_name }} {{ founderData?.surname }}
          </h3>
          <p class="text-xs uppercase tracking-wider text-muted">
            {{ founderData?.role }}
          </p>
        </div>

        <p
          class="text-base max-w-sm text-center lg:text-left lg:text-lg italic text-dimmed leading-relaxed"
        >
          {{ founderData?.bio }}
        </p>

        <UButton
          to="/founder?tab=story"
          label="Read My Story"
          color="neutral"
          variant="link"
          trailing-icon="i-lucide-arrow-right"
          class="self-center lg:self-start px-0"
        />
      </div>

      <div v-if="data" class="max-w-md mx-auto lg:mx-0 w-full">
        <UPricingPlan
          v-bind="data"
          :features="transformedFeatures"
          variant="soft"
          :ui="{
            root: 'bg-muted backdrop-blur-sm',
            features: 'gap-3',
            feature: 'items-center',
            terms: 'w-full',
            featureTitle: 'text-sm leading-tight',
          }"
        >
          <template #description>
            <p class="text-base text-toned">{{ data.description }}</p>
          </template>

          <template #features>
            <ul class="flex flex-col gap-3 flex-1 mt-6 grow-0">
              <li
                v-for="feature in transformedFeatures"
                :key="feature.title"
                class="flex items-center gap-2 min-w-0"
              >
                <UIcon
                  :name="feature.icon"
                  :class="[feature.class, 'size-5 shrink-0']"
                />
                <span class="text-muted text-sm truncate">
                  {{ feature.title }}
                </span>
              </li>
            </ul>
          </template>

          <template #button>
            <div class="pt-4 w-full">
              <ConvertInternal
                offer-slug="mentorship"
                label="Get Started"
                location="product-section"
                block
                size="xl"
              />
            </div>
          </template>
        </UPricingPlan>

        <div class="mt-4 flex flex-col gap-4 justify-center items-center">
          <UBadge variant="soft">OR</UBadge>
          <ConvertExternal
            to="https://github.com/incubrain/founder-funnel"
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

<style scoped>
.bg-grid-white\/\[0\.02\] {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 60px 60px;
}
</style>
