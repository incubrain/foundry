<!-- components/section/Hero2.vue -->
<script setup lang="ts">
const props = defineProps<{
  data: {
    badge: {
      label: string;
      to: string;
      description: string;
      icon: string;
    };
    intro: {
      title: string;
      highlight: string;
      description: string;
    };
    cta: {
      primary: string;
      secondary: string;
    };
    media: {
      src: string;
      alt: string;
    };
    metric: {
      icon: string;
      label: string;
      value: string;
      delta: string;
    };
    trusted: {
      text: string;
      icons: string[];
    };
  };
}>();

const hero = computed(() => props.data);
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
      v-if="hero.badge"
      class="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center"
    >
      <a
        :href="hero.badge.to"
        target="_blank"
        class="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/50 px-3 py-1 text-sm text-neutral-300 transition-colors hover:border-neutral-700 hover:bg-neutral-800"
      >
        <UIcon :name="hero.badge.icon" class="h-4 w-4" />
        <span class="font-medium text-white">{{ hero.badge.label }}</span>
        <span>{{ hero.badge.description }}</span>
      </a>

      <div class="text-center max-w-4xl mx-auto space-y-6 md:space-y-6 mb-8">
        <h1
          class="font-heading font-black text-5xl sm:text-7xl lg:text-7xl text-center tracking-tight mb-8 leading-[1.1]"
        >
          <span class="block text-white">{{ hero.intro.title }}</span>
          <span
            class="block bg-linear-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent"
          >
            {{ hero.intro.highlight }}
          </span>
        </h1>

        <p
          class="font-serif text-lg sm:text-xl md:text-2xl text-neutral-400 max-w-2xl mx-auto leading-relaxed"
        >
          {{ hero.intro.description }}
        </p>

        <div
          class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <ConvertFunnel
            offer-slug="mentorship"
            location="hero"
            size="xl"
            class="font-black text-toned"
          />

          <UButton
            to="#demo"
            variant="link"
            color="neutral"
            size="xl"
            class="font-medium text-neutral-400 hover:text-white transition-colors"
          >
            {{ hero.cta.secondary }}
            <UIcon
              :name="hero.cta.secondaryIcon || 'i-lucide-arrow-right'"
              class="ml-1 w-4 h-4"
            />
          </UButton>
        </div>
      </div>

      <div
        class="relative w-full max-w-5xl mx-auto mt-8 md:mt-12 group perspective-1000"
      >
        <div
          class="absolute -inset-1 bg-linear-to-r from-primary-500 to-secondary-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"
        />

        <div
          class="relative rounded-xl bg-neutral-900 border border-neutral-800 p-2 shadow-2xl ring-1 ring-white/10 transform transition-transform duration-700 hover:scale-[1.01] hover:rotate-x-1"
        >
          <NuxtImg
            :src="hero.media.src"
            :alt="hero.media.alt"
            class="rounded-lg shadow-inner w-full h-auto object-cover border border-neutral-900/50"
          />

          <div
            class="absolute -right-4 top-10 md:-right-12 md:top-20 bg-neutral-900 border border-neutral-800 p-4 rounded-lg shadow-xl items-center gap-3 animate-bounce-slow hidden sm:flex"
          >
            <div
              class="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500"
            >
              <UIcon :name="hero.metric.icon" class="w-6 h-6" />
            </div>
            <div>
              <div class="text-xs text-neutral-400">
                {{ hero.metric.label }}
              </div>
              <div class="text-sm font-bold text-white">
                {{ hero.metric.value }}
                <span class="text-green-500 text-xs">{{
                  hero.metric.delta
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="mt-10 pt-1 border-t border-white/5 w-full max-w-5xl flex flex-col md:flex-row items-center justify-between gap-6 text-neutral-500 text-sm"
      >
        <span>{{ hero.trusted.text }}</span>
        <div
          class="flex gap-6 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
        >
          <UIcon
            v-for="icon in hero.trusted.icons"
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
