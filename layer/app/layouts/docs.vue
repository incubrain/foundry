<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const appConfig = useAppConfig()
const route = useRoute()

// Use unified content page composable
const { collection, getPage, setContext } = useContentPage()

// Fetch page data
const { data: page } = await getPage()

if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true,
  })
}

// Fetch navigation for sidebar
const { data: docsNavigation } = await useAsyncData(
  () => `navigation_${collection.value}`,
  () => queryCollectionNavigation(collection.value),
  {
    watch: [collection],
    transform: (data: ContentNavigationItem[]) => {
      return (
        data.find(item => item.path === `${collection.value}`)?.children
        || data
        || []
      )
    },
  },
)

// Fetch surround (prev/next)
const { data: surround } = await useAsyncData(
  () => `surround-${collection.value}-${route.path}`,
  () =>
    queryCollectionItemSurroundings(collection.value, route.path, {
      fields: ['description'],
    }),
  {
    watch: [() => route.path, collection],
  },
)

// Publish context for components
watchEffect(() => {
  if (!page.value || page.value.path !== route.path) return
  setContext(page.value, {
    navigation: docsNavigation.value,
    surround: surround.value,
    meta: { editPath: route.path },
  })
})

// SEO
watchEffect(() => {
  if (!page.value) return
  const title = page.value.seo?.title || page.value.title
  const description = page.value.seo?.description || page.value.description
  useSeoMeta({ title, ogTitle: title, description, ogDescription: description })
})

// GitHub edit link
const github = appConfig.github
const editLink = computed(() =>
  github
    ? [github.url, 'edit', github.branch, github.rootDir, 'content', route.path]
        .filter(Boolean)
        .join('/')
    : null,
)

provide('navigation_docs', docsNavigation)

useHead({
  link: [
    {
      rel: 'stylesheet',
      href: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
      integrity: 'sha384-n8MVd4RsNI8uYk8U+...snip...',
      crossorigin: 'anonymous',
    },
  ],
})

// Content ready state (for citations/bibliography)
const contentReady = ref(false)

watch(
  page,
  async (newPage) => {
    contentReady.value = false
    if (newPage) {
      await nextTick()
      await nextTick()
      contentReady.value = true
    }
  },
  { immediate: true },
)
</script>

<template>
  <UMain>
    <UContainer>
      <UPage
        v-if="page"
        :key="route.path"
      >
        <!-- LEFT: Static navigation -->
        <template #left>
          <UPageAside>
            <DocsAsideLeftTop />
            <DocsAsideLeftBody />
          </UPageAside>
        </template>

        <!-- MAIN: ALL CONTENT RENDERED HERE -->
        <UPageHeader
          :title="page.title"
          :description="page.description"
          :ui="{ wrapper: 'flex-row items-center flex-wrap justify-between' }"
        >
          <template #links>
            <UButton
              v-for="(link, index) in page.links"
              :key="index"
              size="sm"
              v-bind="link"
            />
            <DocsPageHeaderLinks />
          </template>
        </UPageHeader>

        <UPageBody>
          <div>
            <slot />
          </div>

          <template v-if="contentReady">
            <USeparator>
              <div
                v-if="github"
                class="flex items-center gap-2 text-sm text-muted"
              >
                <UButton
                  variant="link"
                  color="neutral"
                  :to="editLink!"
                  target="_blank"
                  icon="i-lucide-pen"
                >
                  Edit
                </UButton>
                <span>or</span>
                <UButton
                  variant="link"
                  color="neutral"
                  :to="`${github.url}/issues/new/choose`"
                  target="_blank"
                  icon="i-lucide-alert-circle"
                >
                  Report
                </UButton>
              </div>
            </USeparator>

            <UContentSurround
              :key="`surround-${route.path}`"
              :surround="surround"
            />
            <Bibliography :key="`bibliography-${route.path}`" />
          </template>
        </UPageBody>

        <!-- RIGHT: Dynamic TOC -->
        <template
          v-if="page?.body?.toc?.links?.length"
          #right
        >
          <UContentToc
            :key="`toc-${route.path}`"
            highlight
            :title="appConfig.toc?.title || 'Table of Contents'"
            :links="page.body.toc.links"
          >
            <template #bottom>
              <DocsAsideRightBottom />
            </template>
          </UContentToc>
        </template>
      </UPage>
    </UContainer>
  </UMain>
</template>
