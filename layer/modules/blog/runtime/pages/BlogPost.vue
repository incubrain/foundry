<script setup lang="ts">
import { useBlogPost } from '../composables/useBlogPosts'
import { useBlogSeo } from '../composables/useBlogSeo'

const { data: post, error } = await useBlogPost(String(useRoute().params.slug))

// Missing, draft and scheduled all look the same from outside: a plain 404.
if (error.value || !post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
}
useBlogSeo(post.value)
</script>

<template>
  <div v-if="post">
    <UPageHeader
      :title="post.title"
      :description="post.description"
    >
      <template #headline>
        <NuxtTime
          :datetime="post.publishAt"
          year="numeric"
          month="long"
          day="numeric"
        />
      </template>
    </UPageHeader>
    <UPageBody class="max-w-3xl mx-auto">
      <ContentRenderer
        :value="post"
        class="prose prose-lg max-w-none"
      />
    </UPageBody>
  </div>
</template>
