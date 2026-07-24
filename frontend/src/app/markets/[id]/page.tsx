import { Suspense } from 'react';
import { getMarketById, getTrendingMarkets } from '@/lib/api/markets';
import { MarketDetailPage } from '@/components/markets/MarketDetailPage';
import type { Metadata } from 'next';
import { canonicalUrl } from '@/lib/site';

export async function generateStaticParams() {
  const topMarkets = getTrendingMarkets(20);
  return topMarkets.map((market) => ({ id: market.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const market = getMarketById(id);

  if (!market) {
    return { title: 'Mercado - NeuroPredict' };
  }

  const description = market.description.slice(0, 160) + '...';

  return {
    title: `${market.title} - ${market.probability}%`,
    description,
    alternates: {
      canonical: canonicalUrl(`/markets/${market.id}`),
    },
    openGraph: {
      title: market.title,
      description: `Probabilidad actual: ${market.probability}%. ${description}`,
      type: 'article',
      url: canonicalUrl(`/markets/${market.id}`),
      images: [{ url: `/og/market-${market.id}.png`, width: 1200, height: 630, alt: market.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: market.title,
      description: `${market.probability}% de probabilidad`,
      images: [`/og/market-${market.id}.png`],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staticMarket = getMarketById(id);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
                <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
              </div>
              <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      }
    >
      <MarketDetailPage id={id} initialMarket={staticMarket} />
    </Suspense>
  );
}
