export const useCitations = () => {
  const route = useRoute();
  // Create a unique state key per page to avoid leakage
  const key = `citations-${route.path}`;

  const citations = useState<string[]>(key, () => []);

  const addCitation = (id: string) => {
    if (!citations.value.includes(id)) {
      citations.value.push(id);
    }
  };

  const getCitationIndex = (id: string) => {
    return computed(() => citations.value.indexOf(id) + 1);
  };

  return {
    citations,
    addCitation,
    getCitationIndex,
  };
};
