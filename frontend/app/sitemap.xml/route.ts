import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.vidyaloans.in';
  const currentDate = new Date().toISOString().split('T')[0];

  const routes = [
    { url: '', priority: '1.0', changeFrequency: 'daily' },
    { url: '/apply', priority: '0.9', changeFrequency: 'daily' },
    { url: '/apply-loan', priority: '0.9', changeFrequency: 'daily' },
    { url: '/compare-loans', priority: '0.9', changeFrequency: 'weekly' },
    { url: '/emi', priority: '0.8', changeFrequency: 'weekly' },
    { url: '/loan-eligibility', priority: '0.8', changeFrequency: 'weekly' },
    { url: '/loan-assistant', priority: '0.8', changeFrequency: 'weekly' },
    { url: '/search-universities', priority: '0.8', changeFrequency: 'weekly' },
    { url: '/find-university', priority: '0.8', changeFrequency: 'weekly' },
    { url: '/compare-universities', priority: '0.8', changeFrequency: 'weekly' },
    { url: '/admit-predictor', priority: '0.7', changeFrequency: 'weekly' },
    { url: '/sop-analyzer', priority: '0.7', changeFrequency: 'weekly' },
    { url: '/sop-writer', priority: '0.7', changeFrequency: 'weekly' },
    { url: '/grade-converter', priority: '0.7', changeFrequency: 'monthly' },
    { url: '/visa-mock', priority: '0.7', changeFrequency: 'weekly' },
    { url: '/repayment-stress', priority: '0.7', changeFrequency: 'monthly' },
    { url: '/how-it-works', priority: '0.8', changeFrequency: 'monthly' },
    { url: '/about-us', priority: '0.7', changeFrequency: 'monthly' },
    { url: '/blog', priority: '0.8', changeFrequency: 'weekly' },
    { url: '/faq', priority: '0.6', changeFrequency: 'monthly' },
    { url: '/contact', priority: '0.6', changeFrequency: 'monthly' },
    { url: '/community', priority: '0.6', changeFrequency: 'weekly' },
    { url: '/community-events', priority: '0.6', changeFrequency: 'weekly' },
    { url: '/bank-reviews', priority: '0.6', changeFrequency: 'weekly' },
    { url: '/privacy-policy', priority: '0.3', changeFrequency: 'yearly' },
    { url: '/terms-conditions', priority: '0.3', changeFrequency: 'yearly' },
    { url: '/cookies', priority: '0.3', changeFrequency: 'yearly' },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${routes
  .map(
    (r) => `  <url>
    <loc>${baseUrl}${r.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${r.changeFrequency}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
