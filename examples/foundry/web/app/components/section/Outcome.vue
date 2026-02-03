<script setup lang="ts">
const props = defineProps<{
  title?: string
  description?: string
  steps?: Array<{
    id: string
    title: string
    icon: string
    description: string
    result: string
  }>
  features?: Array<{
    title: string
    description: string
    icon: string
  }>
}>()

const normalizedSteps = computed(() => {
  const items = props.steps || []

  if (items.length > 3) {
    console.error(
      `[Outcome Section] Maximum 3 process steps allowed. Found ${items.length}.\n`
      + `Edit content/pages/index.md to reduce steps.`,
    )
  }

  return items.slice(0, 3)
})

const normalizedFeatures = computed(() => props.features || [])
</script>

<template>
  <SectionWrapper
    id="outcome"
    has-bottom
  >
    <SectionHeader
      :title="title"
      :description="description"
    />
    <div
      v-if="normalizedSteps.length"
      class="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mt-12 sm:mt-16"
    >
      <div
        v-for="(step, index) in normalizedSteps"
        :key="step.id"
        class="flex flex-col items-center text-center p-8 rounded-lg"
      >
        <div
          class="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-4"
        >
          <span class="text-xl font-bold text-primary">{{ index + 1 }}</span>
        </div>

        <UIcon
          :name="step.icon"
          class="size-8 text-secondary mb-4"
        />

        <h3 class="text-lg font-heading font-bold mb-2">
          {{ step.title }}
        </h3>

        <p class="text-sm text-muted">
          {{ step.result }}
        </p>
      </div>
    </div>

    <template #bottom>
      <div
        v-if="normalizedFeatures.length"
        class="bg-muted/30 py-16 overflow-hidden"
      >
        <div>
          <div
            class="flex items-center justify-between mb-8 max-w-container mx-auto"
          >
            <h3
              class="text-xl sm:text-2xl font-bold text-center w-full text-highlighted"
            >
              How It Works
            </h3>
          </div>

          <div>
            <UCarousel
              v-slot="{ item }"
              arrows
              loop
              :items="normalizedFeatures"
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
                viewport: 'overflow-visible',
                controls:
                  'relative mt-12 hidden md:flex justify-center max-w-container mx-auto',
                arrows: 'flex gap-4',
                prev: 'flex relative rounded-lg ring-default start-0 sm:start-0 top-0 translate-y-0',
                next: 'flex relative rounded-lg ring-default end-0 sm:end-0 top-0 translate-y-0',
              }"
            >
              <UPageCard
                variant="soft"
                class="h-full"
                :ui="{
                  root: 'bg-default hover:bg-muted/50 transition-colors h-full',
                  body: 'space-y-4',
                  footer: 'w-full',
                }"
              >
                <template #footer>
                  <NuxtImg
                    src="https://placehold.co/400"
                    class="w-full h-32 object-cover"
                  />
                </template>

                <template #body>
                  <div class="flex items-start justify-between gap-3">
                    <h4
                      class="text-base font-heading font-bold text-highlighted flex-1"
                    >
                      {{ item.title }}
                    </h4>
                    <div
                      class="flex items-center justify-center size-8 rounded-lg bg-primary/10 ring-1 ring-primary/20 shrink-0"
                    >
                      <UIcon
                        :name="item.icon"
                        class="size-4 text-secondary"
                      />
                    </div>
                  </div>

                  <p class="text-sm text-muted leading-relaxed">
                    {{ item.description }}
                  </p>
                </template>
              </UPageCard>
            </UCarousel>
          </div>
        </div>
      </div>
    </template>
  </SectionWrapper>
</template>
