export const useDocsMetadata = () => {
  const { data: docs } = useAsyncData('docs-metadata', () =>
    queryCollection('docs')
      .select('path', 'title', 'description', 'label')
      .all(),
  );

  const getPageMetadata = (path: string) => {
    if (!docs.value) return null;

    // Normalize path: ensure leading slash
    // If input is "research/ecology", normalize to "/research/ecology"
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // Try exact match
    const match = docs.value.find((doc) => doc.path === normalizedPath);
    if (match) return match;

    // Handle potential trailing slash differences if needed,
    // though Nuxt Content usually normalizes to no trailing slash
    return docs.value.find(
      (doc) =>
        doc.path.replace(/\/$/, '') === normalizedPath.replace(/\/$/, ''),
    );
  };

  return {
    docs,
    getPageMetadata,
  };
};
