import type { ReferencesCollectionItem } from '@nuxt/content'
import { useFuse } from '@vueuse/integrations/useFuse'

export const useCitations = () => {
  const route = useRoute()
  const { collections } = useContentConfig()

  // ✅ Reactively switch between route-specific state
  const citations = computed({
    get: () => useState<string[]>(`citations-${route.path}`, () => []).value,
    set: (val) => {
      useState<string[]>(`citations-${route.path}`).value = val
    },
  })

  // Fetch references ONCE
  const { data: allCategoryRefs } = useAsyncData('references', () =>
    queryCollection(collections.references).all(),
  )

  const allRefs = computed(() => {
    if (!allCategoryRefs.value) return []
    return allCategoryRefs.value.flatMap(cat =>
      cat.sources.map(
        (source: ReferencesCollectionItem['sources'][number]) => ({
          id: source.id,
          url: source.url,
          pdf: source.pdf,
          title: source.title,
          author: source.author,
          category: cat.category,
          credibilityScore: source.credibilityScore,
          date: source.date,
          description: source.description,
        }),
      ),
    )
  })

  const addCitation = (id: string) => {
    const current = useState<string[]>(`citations-${route.path}`, () => [])
    if (!current.value.includes(id)) {
      current.value.push(id)
    }
  }

  const getCitationIndex = (id: string) => {
    return computed(() => citations.value.indexOf(id) + 1)
  }

  const getReference = (id: string) => {
    return computed(() => allRefs.value.find(r => r.id === id))
  }

  // Find similar IDs using Fuse.js fuzzy search
  const findSimilarIds = (id: string, maxSuggestions = 3) => {
    const searchTerm = ref(id)
    const { results } = useFuse(searchTerm, computed(() => allRefs.value.map(r => r.id)), {
      fuseOptions: {
        threshold: 0.6, // Allow fuzzy matches
        distance: 100,
      },
      resultLimit: maxSuggestions,
      matchAllWhenSearchEmpty: false,
    })

    return computed(() => results.value.map(r => r.item))
  }

  // Validate citation ID and return status
  const validateCitation = (id: string) => {
    const suggestions = findSimilarIds(id)

    return computed(() => {
      if (!allRefs.value.length) {
        return { valid: true, loading: true } // Still loading refs
      }

      const exists = allRefs.value.some(r => r.id === id)
      if (exists) {
        return { valid: true, loading: false }
      }

      return {
        valid: false,
        loading: false,
        suggestions: suggestions.value,
        message: suggestions.value.length
          ? `Citation "${id}" not found. Did you mean: ${suggestions.value.join(', ')}?`
          : `Citation "${id}" not found. No similar IDs found.`,
      }
    })
  }

  return {
    citations,
    allRefs,
    allCategoryRefs,
    addCitation,
    getCitationIndex,
    getReference,
    validateCitation,
    findSimilarIds,
  }
}
