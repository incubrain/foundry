import type { z } from 'zod'

export type PostState = 'draft' | 'scheduled' | 'live'

export interface PostImage {
  src: string
  alt: string
}

/** Blog post frontmatter, as written to disk by the `foundry-blog` writer. */
export interface PostFrontmatter {
  title: string
  description?: string
  /** ISO 8601, UTC `Z`. */
  publishAt: string
  draft?: boolean
  updatedAt?: string
  canonical?: string
  author?: string
  tags?: string[]
  image?: PostImage
  /** Producer record id, e.g. `polaris:article/<id>`. */
  source?: string
  [key: string]: unknown
}

export interface Post {
  frontmatter: PostFrontmatter
  body: string
}

/** The fields liveness depends on (a Nuxt Content row satisfies this). */
export interface PostLiveness {
  publishAt?: unknown
  draft?: unknown
}

export interface PostInput {
  slug?: string
  title: string
  description?: string | null
  body: string
  publishAt?: string | null
  draft?: boolean | null
  canonical?: string | null
  author?: string | null
  tags?: string[] | null
  image?: PostImage | null
  source?: string | null
}

export interface ValidInput extends PostInput {
  slug: string
}

export interface InputIssue {
  path: string
  message: string
}

export type ValidatedInput
  = | { ok: true, value: ValidInput }
    | { ok: false, issues: InputIssue[], message: string }

export const KEY_ORDER: readonly string[]

export function isSlug(slug: unknown): slug is string
export function parsePublishAt(value: unknown): Date | null
export function postState(fm: PostLiveness | null | undefined, now?: Date | number | string): PostState
export function isLive(fm: PostLiveness | null | undefined, now?: Date | number | string): boolean
export function slugify(title: string): string
export function renderPost(post: Post): string
export function parsePost(text: string): Post
export function postInputSchema(): z.ZodObject<z.ZodRawShape>
export function validatePostInput(input: unknown): ValidatedInput
