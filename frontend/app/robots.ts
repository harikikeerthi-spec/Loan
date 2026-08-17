import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vidyaloans.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/landing', '/apply'],
        disallow: [
          '/dashboard',
          '/document-vault',
          '/profile',
          '/support-tickets',
          '/user-details',
          '/staff',
          '/admin',
          '/bank',
          '/agent',
          '/api',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
