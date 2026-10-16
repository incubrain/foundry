export interface BlogImage {
  src: string
  alt: string
}

/** What `/api/_foundry/blog/posts` returns per live post. */
export interface BlogPostSummary {
  path: string
  title: string
  description?: string
  /** ISO 8601 UTC. */
  publishAt: string
  updatedAt?: string
  canonical?: string
  author?: string
  tags?: string[]
  image?: BlogImage
}

/** A live post with its parsed body, ready for `<ContentRenderer>`. */
export interface BlogPost extends BlogPostSummary {
  body: unknown
}

/** Module options under `foundry.blog` in nuxt.config. */
export interface BlogOptions {
  /** Off by default — a site opts in. */
  enabled?: boolean
  /** URL prefix of the list and post pages; must match the `blog` collection's `prefix`. */
  prefix?: string
  /** Heading and feed title of the list page. */
  title?: string
}

export interface BlogModuleOptions {
  blog?: BlogOptions
}

/** Resolved options as exposed in `runtimeConfig.public.foundryBlog`. */
export interface BlogRuntimeConfig {
  prefix: string
  title: string
}
