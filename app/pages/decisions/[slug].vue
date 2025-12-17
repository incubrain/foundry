<script setup lang="ts">
const route = useRoute();
const slug = route.params.slug as string;

// Fetch decision content
const { data: decision } = await useAsyncData(`decision-${slug}`, () =>
  queryCollection('pages').path(`/decisions/${slug}`).first(),
);

// Fetch surround data
const { data: surround } = await useAsyncData(`decision-${slug}-surround`, () =>
  queryCollectionItemSurroundings('pages', `/decisions/${slug}`, {
    fields: ['title', 'description', 'label'],
  }),
);

if (!decision.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Decision not found',
  });
}

useHead({
  title: decision.value.title,
  meta: [
    {
      name: 'description',
      content: decision.value.description,
    },
  ],
});
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UPageAside>
          <div class="space-y-6 py-6">
            <div class="space-y-4">
              <div class="flex flex-col gap-1">
                <!-- Version/Label -->
                <div
                  v-if="decision.label"
                  class="flex items-center text-sm gap-2"
                >
                  <UIcon name="i-lucide-tag" class="size-4 text-primary" />
                  <span class="font-mono font-bold">{{ decision.label }}</span>
                </div>

                <!-- Date -->
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-calendar" class="size-4 text-muted" />
                  <NuxtTime
                    :datetime="decision.date"
                    year="numeric"
                    month="short"
                    day="numeric"
                    class="font-medium"
                  />
                </div>
              </div>
            </div>

            <USeparator />

            <div class="space-y-2">
              <UButton
                to="/decisions"
                icon="i-lucide-arrow-left"
                color="neutral"
                variant="soft"
                size="sm"
                label="Back to Decisions"
                class="justify-start"
              />
              <ConvertFunnel
                offer-slug="mentorship"
                location="decision-sidebar"
                size="sm"
                color="secondary"
              />
            </div>
          </div>
        </UPageAside>
      </template>

      <UPageBody class="max-w-2xl mx-auto">
        <div>
          <div class="lg:hidden mb-8 space-y-6">
            <UButton
              to="/decisions"
              icon="i-lucide-arrow-left"
              color="neutral"
              variant="ghost"
              label="Back to Decisions"
              class="-ml-2.5"
            />

            <div class="flex flex-wrap items-center gap-4 text-sm">
              <div
                v-if="decision.label"
                class="flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/5 border border-primary/10"
              >
                <UIcon name="i-lucide-tag" class="size-3.5 text-primary" />
                <span class="font-mono font-bold text-primary">{{
                  decision.label
                }}</span>
              </div>
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-calendar" class="size-3.5" />
                <NuxtTime
                  :datetime="decision.date"
                  year="numeric"
                  month="long"
                  day="numeric"
                />
              </div>
            </div>
          </div>

          <h1 class="text-4xl font-bold tracking-tight mb-4">
            {{ decision.title }}
          </h1>
          <p class="text-xl text-muted leading-relaxed mb-8">
            {{ decision.description }}
          </p>

          <article class="prose max-w-none">
            <ContentRenderer v-if="decision" :value="decision" />
          </article>

          <USeparator v-if="surround?.filter(Boolean).length" class="my-12" />

          <UContentSurround :surround="surround as any" />

          <div class="lg:hidden mt-12 pt-8 border-t">
            <ConvertButton
              cta-type="banner"
              location="sticky-cta-mobile"
              size="lg"
              block
            />
          </div>
        </div>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
