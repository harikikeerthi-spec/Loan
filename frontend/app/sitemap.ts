import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.vidyaloans.in';
  const currentDate = new Date().toISOString();

  const routes = [
    { url: '', priority: 1.0, changeFrequency: 'daily' as const },
    { url: '/apply', priority: 0.9, changeFrequency: 'daily' as const },
    { url: '/apply-loan', priority: 0.9, changeFrequency: 'daily' as const },
    { url: '/compare-loans', priority: 0.9, changeFrequency: 'weekly' as const },
    { url: '/emi', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/loan-eligibility', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/loan-assistant', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/search-universities', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/find-university', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/compare-universities', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/admit-predictor', priority: 0.7, changeFrequency: 'weekly' as const },
    { url: '/sop-analyzer', priority: 0.7, changeFrequency: 'weekly' as const },
    { url: '/sop-writer', priority: 0.7, changeFrequency: 'weekly' as const },
    { url: '/grade-converter', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/visa-mock', priority: 0.7, changeFrequency: 'weekly' as const },
    { url: '/repayment-stress', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/how-it-works', priority: 0.8, changeFrequency: 'monthly' as const },
    { url: '/about-us', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/blog', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/faq', priority: 0.6, changeFrequency: 'monthly' as const },
    { url: '/contact', priority: 0.6, changeFrequency: 'monthly' as const },
    { url: '/community', priority: 0.6, changeFrequency: 'weekly' as const },
    { url: '/community-events', priority: 0.6, changeFrequency: 'weekly' as const },
    { url: '/bank-reviews', priority: 0.6, changeFrequency: 'weekly' as const },
    { url: '/privacy-policy', priority: 0.3, changeFrequency: 'yearly' as const },
    { url: '/terms-conditions', priority: 0.3, changeFrequency: 'yearly' as const },
    { url: '/cookies', priority: 0.3, changeFrequency: 'yearly' as const },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.url}`,
    lastModified: currentDate,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
