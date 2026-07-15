export function normalizeSopAnalysis(raw: any) {
  const categories = raw?.categories;
  const normalizedCategories = Array.isArray(categories)
    ? categories.reduce<Record<string, number>>((acc, item) => {
        if (item && typeof item === 'object') {
          const name = typeof item.name === 'string' && item.name.trim()
            ? item.name
            : 'Category';
          const score = typeof item.score === 'number' ? item.score : 0;
          acc[name] = score;
        }
        return acc;
      }, {})
    : (categories && typeof categories === 'object' ? categories : {});

  const normalizedWeakAreas = Array.isArray(raw?.weakAreas)
    ? raw.weakAreas
        .map((item: any) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') {
            return item.recommendation || item.issue || item.message || '';
          }
          return '';
        })
        .filter(Boolean)
    : Array.isArray(raw?.improvements)
      ? raw.improvements.filter((item: any) => typeof item === 'string' && item.trim())
      : [];

  return {
    score: raw?.score ?? raw?.totalScore ?? 0,
    humanScore: raw?.humanScore ?? raw?.humanizeScore ?? 85,
    originalityScore: raw?.originalityScore ?? raw?.plagiarismScore ?? 92,
    categories: normalizedCategories,
    weakAreas: normalizedWeakAreas,
    summary: raw?.summary ?? '',
    humanizeFeedback: raw?.humanizeFeedback ?? '',
    plagiarismFeedback: raw?.plagiarismFeedback ?? '',
  };
}
