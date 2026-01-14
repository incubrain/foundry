export const useCitations = () => {
  const route = useRoute();

  // Stable key per route - no clearing needed, state persists per route
  const key = computed(() => `citations-${route.path}`);
  const citations = useState<string[]>(key.value, () => []);

  const addCitation = (id: string) => {
    if (!citations.value.includes(id)) {
      citations.value.push(id);
    }
  };

  const getCitationIndex = (id: string) => {
    return computed(() => citations.value.indexOf(id) + 1);
  };

  const reset = () => {
    citations.value = [];
  };

  return {
    citations,
    addCitation,
    getCitationIndex,
    reset,
  };
};
