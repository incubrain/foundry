import { joinURL } from 'ufo'
import type { BlogPost } from '../types'

/** Article meta + canonical for a live post. Canonical is the frontmatter value, else site URL + path. */
export const useBlogSeo = (post: BlogPost) => {
  const route = useRoute()
  const siteUrl = useSiteConfig().url || useRequestURL().origin

  useSeoMeta({
    title: post.title,
    description: post.description,
    ogTitle: post.title,
    ogDescription: post.description,
    ogType: 'article',
    ogImage: post.image?.src,
    articlePublishedTime: post.publishAt,
    articleModifiedTime: post.updatedAt,
    articleAuthor: post.author ? [post.author] : undefined,
    articleTag: post.tags,
  })
  useHead({
    link: [{ rel: 'canonical', href: post.canonical || joinURL(siteUrl, route.path) }],
  })
}
