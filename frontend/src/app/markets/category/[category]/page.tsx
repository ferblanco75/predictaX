import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CategoryPageClient } from '@/components/markets/CategoryPageClient';
import { getServerMarkets } from '@/lib/api/server-markets';
import { categories, getCategoryById } from '@/lib/data/categories';
import { canonicalUrl } from '@/lib/site';
import type { Market } from '@/lib/types';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.id }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category: categoryId } = await params;
  const category = getCategoryById(categoryId);

  if (!category) {
    return {
      title: 'Categoría no encontrada',
      robots: { index: false, follow: false },
    };
  }

  const url = canonicalUrl(`/markets/category/${category.id}`);

  return {
    title: `Mercados de ${category.name}`,
    description: category.description,
    alternates: { canonical: url },
    openGraph: {
      title: `Mercados de ${category.name}`,
      description: category.description,
      url,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categoryId } = await params;
  const category = getCategoryById(categoryId);

  if (!category) notFound();

  let initialMarkets: Market[] | undefined;
  try {
    initialMarkets = await getServerMarkets({ category: category.id });
  } catch {
    // Omitting initialData lets React Query retry immediately in the browser.
  }

  return <CategoryPageClient category={category} initialMarkets={initialMarkets} />;
}
