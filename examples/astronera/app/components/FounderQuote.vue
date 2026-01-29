<script setup lang="ts">
interface Props {
  quote?: string;
  name?: string;
  title?: string;
  subtitle?: string;
  avatar?: string;
}

const props = defineProps<Props>();

const site = inject<any>('site_config', ref(null));

const socials = computed(() => site.value?.socials ?? {});

const socialLinks = computed(() =>
  Object.entries(socials.value).map(([key, url]) => ({
    'icon': key === 'email' ? 'i-lucide-mail' : `i-simple-icons-${key}`,
    'to': url as string,
    'target': '_blank',
    'aria-label': `${key} social link`,
  })),
);

defineSlots<{
  default(props?: {}): any;
}>();
</script>

<template>
  <div class="max-w-4xl mx-auto text-center">
    <!-- Avatar -->
    <div class="flex justify-center mb-6">
      <NuxtImg
        v-if="avatar"
        :src="avatar"
        :alt="name"
        class="rounded-full w-32 h-32 md:w-40 md:h-40 object-cover ring-4 ring-primary/20"
      />
    </div>

    <!-- Name & Titles -->
    <div class="mb-8 space-y-2">
      <h3 class="text-2xl md:text-3xl font-bold text-highlighted">
        {{ name }}
      </h3>
      <p class="text-base md:text-lg text-muted font-medium">
        {{ title }}
      </p>
      <p v-if="subtitle" class="text-sm md:text-base text-muted/80">
        {{ subtitle }}
      </p>
    </div>

    <!-- Quote -->
    <div
      class="prose prose-lg md:prose-xl dark:prose-invert mx-auto mb-8 text-left"
    >
      <blockquote
        class="border-l-4 border-primary p-6 italic text-lg md:text-xl leading-relaxed bg-primary/10"
      >
        <slot />
      </blockquote>
    </div>

    <!-- Social Links -->
    <div
      v-if="socialLinks.length > 0"
      class="flex justify-center gap-3 flex-wrap"
    >
      <UButton
        v-for="link in socialLinks"
        :key="link.to"
        :icon="link.icon"
        :to="link.to"
        :target="link.target"
        :aria-label="link['aria-label']"
        variant="outline"
        size="lg"
      />
    </div>
  </div>
</template>
