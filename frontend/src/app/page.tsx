import type { Metadata } from 'next';

import { HomePageClient } from '@/components/home/HomePageClient';
import { StructuredData } from '@/components/seo/StructuredData';
import { getAllServerMarkets, getServerVisibleCategories } from '@/lib/api/server-markets';
import { categories } from '@/lib/data/categories';
import { filterVisibleCategories } from '@/lib/data/category-visibility';
import { canonicalUrl } from '@/lib/site';
import { generateOrganizationStructuredData } from '@/lib/utils/structured-data';

export const metadata: Metadata = {
  alternates: {
    canonical: canonicalUrl('/'),
  },
  openGraph: {
    url: canonicalUrl('/'),
  },
};

/**
 * Market counts used to be hardcoded in lib/data/categories.ts, so the home
 * page advertised "Economía — 8 mercados" while the category page listed 23.
 * Counted from the live catalog instead; if the API is unreachable the count
 * is simply left out of the card.
 */
async function getMarketCountsByCategory(): Promise<Record<string, number>> {
  try {
    const markets = await getAllServerMarkets();

    return markets.reduce<Record<string, number>>((counts, market) => {
      counts[market.category] = (counts[market.category] ?? 0) + 1;
      return counts;
    }, {});
  } catch {
    return {};
  }
}

export default async function Home() {
  const [visibility, marketCounts] = await Promise.all([
    getServerVisibleCategories(),
    getMarketCountsByCategory(),
  ]);
  const visibleCategories = filterVisibleCategories(categories, visibility).map((category) => ({
    ...category,
    count: marketCounts[category.id],
  }));

  return (
    <>
      <StructuredData data={generateOrganizationStructuredData()} />
      <HomePageClient categories={visibleCategories} />
    </>
  );
}
