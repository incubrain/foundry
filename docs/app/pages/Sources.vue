<script setup lang="ts">
import type { Collections } from '@nuxt/content';

const siteConfig = useSiteConfig();

definePageMeta({
  layout: 'default',
  // Remove the header
  header: false,
  // Remove the footer
  footer: false,
});
const { locale, isEnabled } = useDocusI18n();
const collectionName = computed(() =>
  isEnabled.value ? `landing_${locale.value}` : 'landing',
);

const { data: page } = await useAsyncData('sources-landing', () =>
  queryCollection(collectionName.value as keyof Collections)
    .path('/sources')
    .first(),
);
if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true,
  });
}

useSeoMeta({
  title: page.value.seo?.title,
  description: page.value.seo?.description,
  ogTitle: page.value.seo?.title,
  ogDescription: page.value.seo?.description,
  ogImage: `${siteConfig.url}/social.png`,
  twitterImage: `${siteConfig.url}/social.png`,
});
</script>

<template>
  <UPage>
    <UPageHero :title="page?.title" :description="page?.description" />
    <UPageBody>
      <UContainer>
        <ContentRenderer v-if="page" :value="page" />
      </UContainer>
    </UPageBody>
  </UPage>
</template>
