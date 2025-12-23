<!-- app/components/content/FeatureGrid.vue -->
<script setup lang="ts">
interface Feature {
  title: string;
  description: string;
  icon?: string;
  to?: string;
  target?: string;
}

interface Props {
  title?: string;
  description?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
  orientation?: 'horizontal' | 'vertical';
}

const props = withDefaults(defineProps<Props>(), {
  columns: 3,
  orientation: 'vertical',
});

const gridClasses = computed(() => {
  const colMap = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };
  return ['grid grid-cols-1 gap-6', colMap[props.columns]].join(' ');
});
</script>

<template>
  <section class="my-16">
    <!-- Section Header -->
    <div v-if="title || description" class="text-center space-y-3 mb-12">
      <h2 v-if="title" class="text-3xl font-bold text-highlighted">
        {{ title }}
      </h2>
      <p v-if="description" class="text-lg text-muted max-w-2xl mx-auto">
        {{ description }}
      </p>
    </div>

    <!-- Feature Grid -->
    <div :class="gridClasses">
      <UPageFeature
        v-for="(feature, index) in features"
        :key="index"
        :title="feature.title"
        :description="feature.description"
        :icon="feature.icon"
        :to="feature.to"
        :target="feature.target"
        :orientation="orientation"
      />
    </div>
  </section>
</template>