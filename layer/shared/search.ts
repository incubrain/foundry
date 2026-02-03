import type { PageCollections } from '@nuxt/content'
import {
  useAppConfig,
  useLazyAsyncData,
  queryCollectionSearchSections,
} from '#imports'

export const useSearch = async () => {
  const appConfig = useAppConfig()
  const searchableCollections
    = appConfig.content?.collections?.searchable || ['docs']

  const { data: searchFiles } = useLazyAsyncData(
    'search_files',
    async () => {
      const sections = await Promise.all(
        searchableCollections.map((collection: keyof PageCollections) =>
          queryCollectionSearchSections(collection)
            .where('path', '<>', '/')
            .catch(() => []),
        ),
      )

      return sections.flat()
    },
    { server: false },
  )

  return {
    searchFiles,
  }
}
