import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MarketList } from '@/components/markets/MarketList';
import { Badge } from '@/components/ui/badge';
import { getMarketsByCategory } from '@/lib/api/markets';
import { categories, getCategoryById } from '@/lib/data/categories';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import type { MarketCategory } from '@/lib/types';

// Generate static params for all categories
export async function generateStaticParams() {
  return categories.map((cat) => ({
    category: cat.id,
  }));
}

// Generate metadata for each category
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const category = getCategoryById(resolvedParams.category);

  if (!category) {
    return {
      title: 'Categoría no encontrada',
    };
  }

  return {
    title: `${category.name} - Mercados de Predicción`,
    description: category.description,
    openGraph: {
      title: `${category.name} - PredictaX`,
      description: `${category.description}. ${category.count} mercados disponibles.`,
      type: 'website',
      url: `https://predictax.com/markets/category/${category.id}`,
      images: [
        {
          url: `/og/category-${category.id}.png`,
          width: 1200,
          height: 630,
          alt: `${category.name} - PredictaX`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} - PredictaX`,
      description: category.description,
      images: [`/og/category-${category.id}.png`],
    },
  };
}

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await params;
  const categoryId = resolvedParams.category as MarketCategory;
  const category = getCategoryById(categoryId);

  if (!category) {
    notFound();
  }

  const markets = getMarketsByCategory(categoryId);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Link
          href="/markets"
          className="mb-4 inline-flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a todos los mercados</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <h1 className="text-4xl font-bold">{category.name}</h1>
            <Badge
              variant="secondary"
              style={{ backgroundColor: `${category.color}20`, color: category.color }}
            >
              {markets.length} {markets.length === 1 ? 'mercado' : 'mercados'}
            </Badge>
          </div>
          <p className="text-gray-600 text-lg">{category.description}</p>
        </div>

        {/* Markets grid */}
        <MarketList markets={markets} />
      </div>
    </div>
  );
}
