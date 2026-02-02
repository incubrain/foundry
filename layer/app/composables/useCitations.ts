import type { ReferencesCollectionItem } from '@nuxt/content';

export const useCitations = () => {
  const route = useRoute();
  const { collections } = useContentConfig();

  // ✅ Reactively switch between route-specific state
  const citations = computed({
    get: () => useState<string[]>(`citations-${route.path}`, () => []).value,
    set: (val) => {
      useState<string[]>(`citations-${route.path}`).value = val;
    },
  });

  // Fetch references ONCE
  const { data: allCategoryRefs } = useAsyncData('references', () =>
    queryCollection(collections.references).all(),
  );

  const allRefs = computed(() => {
    if (!allCategoryRefs.value) return [];
    return allCategoryRefs.value.flatMap((cat) =>
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
    );
  });

  const addCitation = (id: string) => {
    const current = useState<string[]>(`citations-${route.path}`, () => []);
    if (!current.value.includes(id)) {
      current.value.push(id);
    }
  };

  const getCitationIndex = (id: string) => {
    return computed(() => citations.value.indexOf(id) + 1);
  };

  const getReference = (id: string) => {
    return computed(() => allRefs.value.find((r) => r.id === id));
  };

  return {
    citations,
    allRefs,
    allCategoryRefs,
    addCitation,
    getCitationIndex,
    getReference,
  };
};
