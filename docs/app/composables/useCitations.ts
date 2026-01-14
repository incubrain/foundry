import type { Collections, ReferencesEnCollectionItem } from '@nuxt/content';

export const useCitations = () => {
  const route = useRoute();
  const { locale, isEnabled } = useDocusI18n();
  const collectionName = computed(() =>
    isEnabled.value ? `references_${locale.value}` : 'references',
  );

  // Stable key per route - state persists per route
  const key = computed(() => `citations-${route.path}`);
  const citations = useState<string[]>(key.value, () => []);

  // ✅ Fetch references ONCE and cache globally with key 'references'
  const { data: allCategoryRefs } = useAsyncData('references', () =>
    queryCollection(collectionName.value as keyof Collections).all(),
  );

  // ✅ Flatten references for easy lookup
  const allRefs = computed(() => {
    if (!allCategoryRefs.value) return [];
    return allCategoryRefs.value.flatMap((cat) =>
      cat.sources.map((source) => ({
        id: source.id,
        url: source.url,
        pdf: source.pdf,
        title: source.title,
        author: source.author,
        category: cat.category,
        credibility: source.credibility,
        date: source.date,
        description: source.description,
      })),
    );
  });

  const addCitation = (id: string) => {
    if (!citations.value.includes(id)) {
      citations.value.push(id);
    }
  };

  const getCitationIndex = (id: string) => {
    return computed(() => citations.value.indexOf(id) + 1);
  };

  const getReference = (id: string) => {
    return computed(() => allRefs.value.find((r) => r.id === id));
  };

  const reset = () => {
    citations.value = [];
  };

  return {
    citations,
    allRefs,
    allCategoryRefs,
    addCitation,
    getCitationIndex,
    getReference,
    reset,
  };
};
