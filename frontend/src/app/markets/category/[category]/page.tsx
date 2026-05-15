'use client';

import { Suspense } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MarketList } from '@/components/markets/MarketList';
import { MundialHero } from '@/components/markets/MundialHero';
import { useMarkets } from '@/lib/hooks/useMarkets';
import { getCategoryById } from '@/lib/data/categories';
import type { MarketCategory } from '@/lib/types';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

function CategoryContent({ categoryId }: { categoryId: MarketCategory }) {
  const category = getCategoryById(categoryId);
  const { data: markets = [], isLoading } = useMarkets({ category: categoryId, limit: 100 });

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">Categoría no encontrada.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/markets"
          className="mb-4 inline-flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a todos los mercados</span>
        </Link>

        {/* Hero mundialista si corresponde */}
        {categoryId === 'mundial' && (
          <MundialHero featuredPolls={markets.slice(0, 3)} totalPolls={markets.length} />
        )}

        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <h1 className="text-4xl font-bold">{category.name}</h1>
            {!isLoading && (
              <Badge
                variant="secondary"
                style={{ backgroundColor: `${category.color}20`, color: category.color }}
              >
                {markets.length} {markets.length === 1 ? 'mercado' : 'mercados'}
              </Badge>
            )}
          </div>
          <p className="text-gray-600 text-lg">{category.description}</p>
        </div>

        <MarketList markets={markets} isLoading={isLoading} />
      </div>
    </div>
  );
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { category } = use(params);
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    }>
      <CategoryContent categoryId={category as MarketCategory} />
    </Suspense>
  );
}
