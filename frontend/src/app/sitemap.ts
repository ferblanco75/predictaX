import { MetadataRoute } from 'next';
import { getAllServerMarkets } from '@/lib/api/server-markets';
import { categories } from '@/lib/data/categories';
import { CANONICAL_BASE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: CANONICAL_BASE_URL,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${CANONICAL_BASE_URL}/markets`,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${CANONICAL_BASE_URL}/about`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${CANONICAL_BASE_URL}/metodologia`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${CANONICAL_BASE_URL}/terms`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${CANONICAL_BASE_URL}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${CANONICAL_BASE_URL}/security-policy`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${CANONICAL_BASE_URL}/markets/category/${cat.id}`,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const markets = await getAllServerMarkets();
  const marketPages = markets.map((market) => ({
    url: `${CANONICAL_BASE_URL}/markets/${market.id}`,
    changeFrequency: 'hourly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...marketPages];
}
