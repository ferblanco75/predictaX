import { MetadataRoute } from 'next';
import { getAllMarkets } from '@/lib/api/markets';
import { categories } from '@/lib/data/categories';
import type { Market } from '@/lib/types';
import { CANONICAL_BASE_URL } from '@/lib/site';

const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;

export const revalidate = 3600;

async function getSitemapMarkets(): Promise<Market[]> {
  if (!API_URL) {
    return getAllMarkets();
  }

  try {
    const response = await fetch(`${API_URL}/markets?status=active&limit=100`, {
      next: { revalidate },
    });

    if (!response.ok) {
      return getAllMarkets();
    }

    return response.json();
  } catch {
    return getAllMarkets();
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: CANONICAL_BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${CANONICAL_BASE_URL}/markets`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${CANONICAL_BASE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${CANONICAL_BASE_URL}/waitlist`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${CANONICAL_BASE_URL}/markets/category/${cat.id}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: cat.id === 'mundial' ? 0.95 : 0.8,
  }));

  const markets = await getSitemapMarkets();
  const marketPages = markets.map((market) => ({
    url: `${CANONICAL_BASE_URL}/markets/${market.id}`,
    lastModified: now,
    changeFrequency: 'hourly' as const,
    priority: market.category === 'mundial' ? 0.85 : 0.7,
  }));

  return [...staticPages, ...categoryPages, ...marketPages];
}
