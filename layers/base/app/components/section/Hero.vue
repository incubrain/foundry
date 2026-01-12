<!-- components/section/Hero2.vue -->
<script setup lang="ts">
// PRD: Flat props, explicit structure
const props = defineProps<{
  badge?: {
    label: string;
    to: string;
    description: string;
    icon: string;
  };
  intro?: {
    title: string;
    highlight: string;
    description: string;
  };
  cta?: {
    primary?: {
      label: string;
      offerSlug?: string;
      to?: string;
      icon?: string;
      size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    };
    secondary?: {
      label: string;
      to: string;
      icon?: string;
      variant?: 'button' | 'link';
      color?: string;
      size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    };
  };
  media?: {
    src: string;
    alt: string;
  };
  metric?: {
    icon: string;
    label: string;
    value: string;
    delta: string;
  };
  trusted?: {
    text: string;
    icons: string[];
  };
}>();

// Hero doesn't strictly follow the header/cta layout, so we implement custom structure
// but avoid deprecated wrapper props.
</script>

<template>
  <section
    class="relative overflow-hidden bg-neutral-950 text-white min-h-[85vh] flex items-center justify-center pt-12 pb-16"
  >
    <div
      class="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_40%_-20%,rgba(0,156,24,0.2),rgba(255,255,255,0))]"
    />

    <div
      class="absolute top-0 inset-0 bg-grid-white/[0.02] pointer-events-none z-0"
    />

    <div
      v-if="badge"
      class="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center"
    >
      <a
        :href="badge.to"
        target="_blank"
        class="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/50 px-3 py-1 text-sm text-neutral-300 transition-colors hover:border-neutral-700 hover:bg-neutral-800"
      >
        <UIcon :name="badge.icon" class="h-4 w-4" />
        <span class="font-medium text-white">{{ badge.label }}</span>
        <span>{{ badge.description }}</span>
      </a>

      <div
        v-if="intro"
        class="text-center max-w-4xl mx-auto space-y-6 md:space-y-6 mb-8"
      >
        <h1
          class="font-heading font-black text-5xl sm:text-7xl lg:text-7xl text-center tracking-tight mb-8 leading-[1.1]"
        >
          <span class="block text-white">{{ intro.title }}</span>
          <span
            class="block bg-linear-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent"
          >
            {{ intro.highlight }}
          </span>
        </h1>

        <p
          class="font-serif text-lg sm:text-xl md:text-2xl text-neutral-400 max-w-2xl mx-auto leading-relaxed"
        >
          {{ intro.description }}
        </p>

        <div
          v-if="cta && (cta.primary || cta.secondary)"
          class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <!-- Primary CTA - Internal conversion or direct link -->
          <ConvertInternal
            v-if="cta.primary && cta.primary.offerSlug"
            :offer-slug="cta.primary.offerSlug"
            :label="cta.primary.label"
            location="hero"
            :size="cta.primary.size || 'xl'"
            class="font-black text-toned"
          />
          <UButton
            v-else-if="cta.primary"
            :to="cta.primary.to"
            :label="cta.primary.label"
            :icon="cta.primary.icon"
            color="primary"
            :size="cta.primary.size || 'xl'"
            class="font-black"
          />

          <!-- Secondary CTA - External or internal link -->
          <ConvertExternal
            v-if="cta.secondary && cta.secondary.to.startsWith('http')"
            :to="cta.secondary.to"
            :label="cta.secondary.label"
            :icon="cta.secondary.icon"
            type="social"
            location="hero"
            :variant="cta.secondary.variant || 'button'"
            :button-color="cta.secondary.color || 'neutral'"
            button-variant="link"
            :button-size="cta.secondary.size || 'xl'"
          />
          <UButton
            v-else-if="cta.secondary"
            :to="cta.secondary.to"
            :label="cta.secondary.label"
            :icon="cta.secondary.icon"
            :color="cta.secondary.color || 'neutral'"
            variant="link"
            :size="cta.secondary.size || 'xl'"
          />
        </div>
      </div>

      <div
        v-if="media"
        class="relative w-full max-w-5xl mx-auto mt-8 md:mt-12 group perspective-1000"
      >
        <div
          class="absolute -inset-1 bg-linear-to-r from-primary-500 to-secondary-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"
        />

        <div
          class="relative rounded-xl bg-neutral-900 border border-neutral-800 p-2 shadow-2xl ring-1 ring-white/10 transform transition-transform duration-700 hover:scale-[1.01] hover:rotate-x-1"
        >
          <NuxtImg
            :src="media.src"
            :alt="media.alt"
            class="rounded-lg shadow-inner w-full h-auto object-cover border border-neutral-900/50"
          />

          <div
            v-if="metric"
            class="absolute -right-4 top-10 md:-right-12 md:top-20 bg-neutral-900 border border-neutral-800 p-4 rounded-lg shadow-xl items-center gap-3 animate-bounce-slow hidden sm:flex"
          >
            <div
              class="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500"
            >
              <UIcon :name="metric.icon" class="w-6 h-6" />
            </div>
            <div>
              <div class="text-xs text-neutral-400">
                {{ metric.label }}
              </div>
              <div class="text-sm font-bold text-white">
                {{ metric.value }}
                <span class="text-green-500 text-xs">{{ metric.delta }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="trusted"
        class="mt-10 pt-1 border-t border-white/5 w-full max-w-5xl flex flex-col md:flex-row items-center justify-between gap-6 text-neutral-500 text-sm"
      >
        <span>{{ trusted.text }}</span>
        <div
          class="flex gap-6 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
        >
          <UIcon
            v-for="icon in trusted.icons"
            :key="icon"
            :name="icon"
            class="w-6 h-6"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.perspective-1000 {
  perspective: 1000px;
}
.rotate-x-1 {
  transform: rotateX(1deg);
}

.bg-grid-white\/\[0\.02\] {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 60px 60px;
}

@keyframes bounce-slow {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
.animate-bounce-slow {
  animation: bounce-slow 4s infinite ease-in-out;
}
</style>
