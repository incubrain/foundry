import { computed } from 'vue'
import {
  useAsyncData,
  useAppConfig,
  queryCollectionNavigation,
  queryCollection,
} from '#imports'
import type { ContentNavigationItem, PageCollections } from '@nuxt/content'
import type { BannerProps } from '@nuxt/ui'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface NavigationLink {
  label: string
  to: string
  icon?: string
  target?: string
}

export interface NavigationColumn extends NavigationLink {
  children?: NavigationLink[]
}

export interface HeaderConfig {
  title?: string
  socials?: Record<string, string>
  navigation?: NavigationLink[]
  showSearch?: boolean
  showColorMode?: boolean
}

export interface FooterConfig {
  columns?: NavigationColumn[]
  bottom?: NavigationLink[]
}

export interface NavigationConfig {
  banner?: BannerProps
  header?: HeaderConfig
  footer?: FooterConfig
}

/* -------------------------------------------------------------------------- */
/*                               COMPOSABLE                                   */
/* -------------------------------------------------------------------------- */

export const useNavigation = async () => {
  const appConfig = useAppConfig()
  const searchableCollections = appConfig.content?.searchable || ['pages']

  /* -------------------------------- config -------------------------------- */

  const { data: config } = await useAsyncData('navigation_config', async () => {
    try {
      return (await queryCollection('navigation').first()) as NavigationConfig
    }
    catch (error) {
      console.warn(`[navigation] Failed to load config: ${error instanceof Error ? error.message : String(error)}`)
      return {}
    }
  })

  /* --------------------------- content navigation -------------------------- */
  // Used for docs sidebar and search - auto-generated from content files

  const { data: contentNavigation } = await useAsyncData(
    'navigation_content',
    async () => {
      if (!searchableCollections?.length) return []

      const collections = await Promise.all(
        searchableCollections.map((collection: string) =>
          // `label` is a pages-schema field; a consumer's other page collections
          // (the blog has none) must not turn this into a TS2322 in their typecheck.
          queryCollectionNavigation(collection as keyof PageCollections, [
            'path',
            'title',
            'description',
            'label',
          ] as unknown as ['path'])
            .where('path', '<>', '/')
            .catch(() => [] as ContentNavigationItem[]),
        ),
      )

      return collections.flat()
    },
  )

  /* -------------------------- canonical navigation -------------------------- */
  // Full content tree for docs sidebar and search

  const navigationAll = computed<ContentNavigationItem[]>(() => {
    return contentNavigation.value ?? []
  })

  /* ------------------------------ header nav -------------------------------- */
  // Entirely from navigation.yml - no content merging

  const navigationHeader = computed<HeaderConfig>(() => {
    return {
      title: config.value?.header?.title,
      socials: config.value?.header?.socials,
      navigation: config.value?.header?.navigation ?? [],
      showSearch: config.value?.header?.showSearch ?? true,
      showColorMode: config.value?.header?.showColorMode ?? true,
    }
  })

  /* ------------------------------ footer nav -------------------------------- */
  // Entirely from navigation.yml - no content merging

  const navigationFooter = computed<FooterConfig>(() => {
    return {
      columns: config.value?.footer?.columns ?? [],
      bottom: config.value?.footer?.bottom ?? [],
    }
  })

  /* ------------------------------ banner -------------------------------- */

  const banner = computed<BannerProps | undefined>(() => {
    return config.value?.banner
  })

  /* -------------------------------- return -------------------------------- */

  return {
    navigationAll,
    navigationHeader,
    navigationFooter,
    banner,
  }
}
