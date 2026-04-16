import { MetadataRoute } from 'next';
import { getAllMarkets } from '@/lib/api/markets';
import { categories } from '@/lib/data/categories';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.neuropredict.io';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/markets`,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/waitlist`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${BASE_URL}/markets/category/${cat.id}`,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // Market pages (dynamic — generated from data)
  let marketPages: MetadataRoute.Sitemap = [];
  try {
    const markets = await getAllMarkets();
    marketPages = markets.map((market) => ({
      url: `${BASE_URL}/markets/${market.id}`,
      changeFrequency: 'hourly' as const,
      priority: 0.7,
    }));
  } catch {
    // If API is not available, use empty list — sitemap still works with static pages
  }

  return [...staticPages, ...categoryPages, ...marketPages];
}
