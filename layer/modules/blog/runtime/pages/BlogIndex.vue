<script setup lang="ts">
import type { BlogRuntimeConfig } from '../types'
import { useBlogPosts } from '../composables/useBlogPosts'

const { prefix, title } = useRuntimeConfig().public.foundryBlog as BlogRuntimeConfig
const { data: posts } = await useBlogPosts()

useSeoMeta({ title, ogTitle: title })
useHead({
  link: [{ rel: 'alternate', type: 'application/rss+xml', title, href: `${prefix}/rss.xml` }],
})
</script>

<template>
  <div>
    <UPageHeader :title="title" />
    <UPageBody>
      <UBlogPosts v-if="posts?.length">
        <UBlogPost
          v-for="post in posts"
          :key="post.path"
          :title="post.title"
          :description="post.description"
          :date="post.publishAt"
          :image="post.image"
          :to="post.path"
        />
      </UBlogPosts>
    </UPageBody>
  </div>
</template>
