<script setup lang="ts">
interface CarouselItem {
  title: string;
  description: string;
  icon: string;
}

interface Props {
  items?: CarouselItem[];
}

defineProps<Props>();
</script>

<template>
  <div class="overflow-hidden">
    <UCarousel
      v-slot="{ item }"
      :items="items"
      arrows
      loop
      :prev="{
        size: 'xl',
        square: true,
      }"
      :next="{
        size: 'xl',
        square: true,
      }"
      :ui="{
        item: 'basis-[320px] px-2 h-[360px]',
        viewport:
          'overflow-hidden border-x border-8 border-secondary p-4 bg-primary/10',
        controls:
          'relative mt-12 hidden md:flex justify-center max-w-container mx-auto',
        arrows: 'flex gap-4',
        prev: 'flex relative rounded-lg ring-default start-0 sm:start-0 top-0 translate-y-0',
        next: 'flex relative rounded-lg ring-default end-0 sm:end-0 top-0 translate-y-0',
      }"
    >
      <UCard
        :ui="{
          root: 'bg-default hover:bg-muted/50 transition-colors h-full',
          body: 'space-y-4 p-0 sm:p-0 px-6 sm:px-4 items-start',
          header: 'space-y-2',
        }"
      >
        <template #header>
          <div class="flex items-start gap-4">
            <div class="shrink-0">
              <UIcon :name="item.icon" class="size-8 text-primary" />
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold text-highlighted">
                {{ item.title }}
              </h3>
            </div>
          </div>
        </template>

        <div>
          <MDC :value="item.description" />
        </div>
      </UCard>
    </UCarousel>
  </div>
</template>
