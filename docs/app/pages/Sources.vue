<script setup lang="ts">
import { titleCase } from 'scule';

const siteConfig = useSiteConfig();

const { data: page } = await useAsyncData('sources-landing', () =>
  queryCollection('landing').path('/sources').first(),
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
