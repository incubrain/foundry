<!-- app/components/content/ComparisonList.vue -->
<script setup lang="ts">
interface ComparisonItem {
  text: string;
}

interface Column {
  title: string;
  icon?: string;
  color?: 'error' | 'warning' | 'neutral' | 'success' | 'info' | 'primary';
  items: ComparisonItem[];
}

interface Props {
  title?: string;
  left: Column;
  right: Column;
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
});

// Set defaults for columns if not provided
const leftColumn = computed(() => ({
  icon: props.left.icon || 'i-lucide-x',
  color: props.left.color || 'error',
  ...props.left,
}));

const rightColumn = computed(() => ({
  icon: props.right.icon || 'i-lucide-check',
  color: props.right.color || 'success',
  ...props.right,
}));

const colorClasses = {
  error: 'text-error',
  warning: 'text-warning',
  neutral: 'text-neutral',
  success: 'text-success',
  info: 'text-info',
  primary: 'text-primary',
};

const leftColorClass = computed(() => colorClasses[leftColumn.value.color]);
const rightColorClass = computed(() => colorClasses[rightColumn.value.color]);
</script>

<template>
  <section class="my-12">
    <!-- Section Title (optional) -->
    <h2 v-if="title" class="text-2xl font-bold text-highlighted mb-8">
      {{ title }}
    </h2>

    <!-- Comparison Grid -->
    <div class="grid md:grid-cols-2 gap-8 md:gap-12">
      <!-- Left Column -->
      <div class="space-y-4">
        <div class="flex items-center gap-2 mb-6">
          <UIcon
            :name="leftColumn.icon"
            :class="['text-2xl', leftColorClass]"
          />
          <h3 :class="['text-xl font-bold', leftColorClass]">
            {{ leftColumn.title }}
          </h3>
        </div>

        <ul class="space-y-3">
          <li
            v-for="(item, index) in leftColumn.items"
            :key="index"
            class="flex items-start gap-3 text-muted"
          >
            <UIcon
              :name="leftColumn.icon"
              :class="['mt-1 shrink-0', leftColorClass]"
            />
            <span>{{ item.text }}</span>
          </li>
        </ul>
      </div>

      <!-- Right Column -->
      <div class="space-y-4">
        <div class="flex items-center gap-2 mb-6">
          <UIcon
            :name="rightColumn.icon"
            :class="['text-2xl', rightColorClass]"
          />
          <h3 :class="['text-xl font-bold', rightColorClass]">
            {{ rightColumn.title }}
          </h3>
        </div>

        <ul class="space-y-3">
          <li
            v-for="(item, index) in rightColumn.items"
            :key="index"
            class="flex items-start gap-3 text-muted"
          >
            <UIcon
              :name="rightColumn.icon"
              :class="['mt-1 shrink-0', rightColorClass]"
            />
            <span>{{ item.text }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Optional Alert Slot -->
    <div v-if="$slots.default" class="mt-8">
      <slot />
    </div>
  </section>
</template>
