<script setup lang="ts">
import { useNavigation } from '#navigation';
import { useSearch } from '#search';

const { getSiteConfig } = useContentCache();

const { title, seo } = useAppConfig();
const { data: site } = getSiteConfig();

/* -------------------------------------------------------------------------- */
/*                             LOAD COMPOSABLES                                */
/* -------------------------------------------------------------------------- */

const { navigationHeader, navigationFooter, navigationAll, banner } =
  await useNavigation();

const { searchFiles } = await useSearch();

/* -------------------------------------------------------------------------- */
/*                                   META                                     */
/* -------------------------------------------------------------------------- */

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'en', dir: 'ltr' },
});

useSeoMeta({
  titleTemplate: seo.titleTemplate,
  title: seo.title,
  description: seo.description,
  ogSiteName: title,
  twitterCard: 'summary_large_image',
});

/* -------------------------------------------------------------------------- */
/*                              GLOBAL PROVIDES                                */
/* -------------------------------------------------------------------------- */

// Canonical navigation graph (for search, docs sidebar, etc.)
provide('navigation_all', navigationAll);

// Header navigation data
provide('navigation_header', navigationHeader);

// Footer navigation data
provide('navigation_footer', navigationFooter);

// Banner configuration
provide('banner_config', banner);

// Site-wide metadata
provide('site_config', site);
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator color="var(--ui-primary)" />

    <AppBanner v-if="$route.meta.banner !== false" />

    <AppHeader v-if="$route.meta.header !== false" />

    <NuxtLayout v-slot="{ page }">
      <NuxtPage :page />
    </NuxtLayout>

    <AppFooter v-if="$route.meta.footer !== false" />

    <ClientOnly>
      <LazyUContentSearch :files="searchFiles" :navigation="navigationAll" />
    </ClientOnly>
  </UApp>
</template>
