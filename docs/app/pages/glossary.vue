<script setup lang="ts">
const siteConfig = useSiteConfig();

definePageMeta({
  layout: 'default',
});

const { data: page } = await useAsyncData('glossary-landing', () =>
  queryCollection('landing').path('/glossary').first(),
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
        <GlossaryTable />
      </UContainer>
    </UPageBody>
  </UPage>
</template>
