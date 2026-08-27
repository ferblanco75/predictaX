import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { MarketDetailPage } from '@/components/markets/MarketDetailPage';
import { getServerMarket } from '@/lib/api/server-markets';
import { canonicalUrl } from '@/lib/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const market = await getServerMarket(id);

  if (!market) {
    return {
      title: 'Mercado no encontrado',
      robots: { index: false, follow: false },
    };
  }

  const description =
    market.description.length > 160
      ? `${market.description.slice(0, 157).trimEnd()}...`
      : market.description;
  const url = canonicalUrl(`/markets/${market.id}`);

  return {
    title: `${market.title} - ${market.probability}%`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: market.title,
      description: `Probabilidad actual: ${market.probability}%. ${description}`,
      type: 'article',
      url,
    },
    twitter: {
      card: 'summary',
      title: market.title,
      description: `${market.probability}% de probabilidad`,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const market = await getServerMarket(id);

  if (!market) notFound();

  return <MarketDetailPage id={id} initialMarket={market} />;
}
