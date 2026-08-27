import type { Metadata } from 'next';

import { MarketsPageClient } from '@/components/markets/MarketsPageClient';
import { getServerMarkets } from '@/lib/api/server-markets';
import { getCategoryById } from '@/lib/data/categories';
import { canonicalUrl } from '@/lib/site';
import type { Market } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Mercados de predicción',
  description:
    'Explorá mercados de predicción sobre economía, política, deportes, tecnología y criptomonedas en América Latina.',
  alternates: { canonical: canonicalUrl('/markets') },
  openGraph: {
    title: 'Mercados de predicción',
    description:
      'Explorá mercados de predicción sobre economía, política, deportes, tecnología y criptomonedas en América Latina.',
    url: canonicalUrl('/markets'),
  },
};

interface MarketsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export default async function MarketsPage({ searchParams }: MarketsPageProps) {
  const query = await searchParams;
  const pageValue = Number.parseInt(firstValue(query.page), 10);
  const initialPage = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1;
  const initialQuery = firstValue(query.q);
  const categoryValue = firstValue(query.categoria);
  const initialCategory = getCategoryById(categoryValue)?.id;

  let initialMarkets: Market[] | undefined;
  try {
    initialMarkets = await getServerMarkets();
  } catch {
    // Omitting initialData lets React Query retry immediately in the browser.
  }

  return (
    <MarketsPageClient
      key={`${initialPage}:${initialQuery}:${initialCategory ?? ''}`}
      initialMarkets={initialMarkets}
      initialPage={initialPage}
      initialQuery={initialQuery}
      initialCategory={initialCategory}
      showWelcomeInitially={firstValue(query.welcome) === '1'}
    />
  );
}
