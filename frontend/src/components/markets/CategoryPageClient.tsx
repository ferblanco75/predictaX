'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { MarketList } from '@/components/markets/MarketList';
import { useMarkets } from '@/lib/hooks/useMarkets';
import type { Category, Market } from '@/lib/types';

interface CategoryPageClientProps {
  category: Category;
  initialMarkets?: Market[];
}

export function CategoryPageClient({ category, initialMarkets }: CategoryPageClientProps) {
  const { data: markets = [], isLoading } = useMarkets({
    category: category.id,
    limit: 100,
    initialData: initialMarkets,
  });

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

        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
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
