import { inject, type Ref } from 'vue'
import type { ContentNavigationItem } from '@nuxt/content'
import { flattenNavigation } from '~/utils/navigation'

export const useDocsMetadata = () => {
  // Use the navigation data already provided globally by app.vue
  // This avoids a redundant query since useNavigation() uses queryCollectionNavigation
  const navigationAll = inject<Ref<ContentNavigationItem[]>>('navigation_all')

  const getPageMetadata = (path: string) => {
    if (!navigationAll?.value) return null

    // Strip hash fragment if present (e.g., "/policy/recommendations#section-1" -> "/policy/recommendations")
    const pathWithoutHash = path.split('#')[0] ?? path

    // Normalize path: ensure leading slash
    // Also prepend configured docs prefix if present
    const appConfig = useAppConfig()
    const prefix = appConfig.routing?.docs || ''
    const normalizedPath = pathWithoutHash.startsWith('/')
      ? `${prefix}${pathWithoutHash}`
      : `${prefix}/${pathWithoutHash}`

    // Flatten the navigation tree for searching
    const flatNav = flattenNavigation(navigationAll.value)

    // Try exact match
    const match = flatNav.find(item => item.path === normalizedPath)
    if (match) return match

    // Handle potential trailing slash differences
    return flatNav.find(
      item =>
        item.path?.replace(/\/$/, '') === normalizedPath.replace(/\/$/, ''),
    )
  }

  return {
    getPageMetadata,
  }
}
