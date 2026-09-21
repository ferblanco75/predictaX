import type { Metadata } from 'next';

import { HomePageClient } from '@/components/home/HomePageClient';
import { StructuredData } from '@/components/seo/StructuredData';
import { getServerVisibleCategories } from '@/lib/api/server-markets';
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

export default async function Home() {
  const visibility = await getServerVisibleCategories();
  const visibleCategories = filterVisibleCategories(categories, visibility);

  return (
    <>
      <StructuredData data={generateOrganizationStructuredData()} />
      <HomePageClient categories={visibleCategories} />
    </>
  );
}
