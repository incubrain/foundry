<script setup lang="ts">
const route = useRoute()

// Use unified content page composable
const { getPage, setContext } = useContentPage()

// Get business name from site config
const { getSiteConfig } = useContentCache()
const { data: siteConfig } = await getSiteConfig()
const pageTitle = computed(() => siteConfig.value?.business?.name || 'Welcome')

// Fetch page data
const { data: page } = await getPage()

if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true,
  })
}

// Publish context for components
watchEffect(() => {
  if (!page.value || page.value.path !== route.path) return
  setContext(page.value)
})

// SEO
watchEffect(() => {
  if (!page.value) return
  useSeoMeta({
    title: page.value.title,
    description: page.value.description,
    ogTitle: page.value.title,
    ogDescription: page.value.description,
  })
})

// OG Image generation
watch(
  page,
  async (newPage) => {
    if (newPage) {
      defineOgImage({
        component: 'Frame',
        props: {
          title: newPage.title,
          description: newPage.description,
          image: siteConfig.value?.business?.logo,
        },
      })
    }
  },
  { immediate: true },
)
</script>

<template>
  <UMain>
    <div
      class="relative min-h-screen flex flex-col items-center justify-center overflow-hidden py-16 sm:py-20 lg:py-24"
    >
      <!-- Background decoration -->
      <div class="absolute inset-0 pointer-events-none">
        <div
          class="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-primary/5 to-transparent"
        />
        <div
          class="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"
        />
      </div>

      <!-- Logo -->
      <div class="flex justify-center w-full z-50 pointer-events-none">
        <div class="pointer-events-auto">
          <NuxtLink to="/"><AppLogo :title="pageTitle" /></NuxtLink>
        </div>
      </div>

      <!-- Content wrapper -->
      <UContainer class="relative z-10">
        <div class="max-w-3xl mx-auto">
          <UPageHero
            :title="page?.title"
            :description="page?.description"
          />
          <slot />
        </div>
      </UContainer>
    </div>
  </UMain>
</template>
