import 'server-only';

import { cache } from 'react';

import type { Market, MarketCategory, MarketStatus } from '@/lib/types';

const API_URL = (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || '').replace(
  /\/$/,
  ''
);

const REVALIDATE_SECONDS = 300;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface GetServerMarketsParams {
  category?: MarketCategory;
  status?: MarketStatus;
  limit?: number;
  offset?: number;
}

export async function getServerMarkets({
  category,
  status = 'active',
  limit = 100,
  offset = 0,
}: GetServerMarketsParams = {}): Promise<Market[]> {
  if (!API_URL) {
    throw new Error('Market API URL is not configured');
  }

  const query = new URLSearchParams({
    status,
    limit: String(limit),
    offset: String(offset),
  });
  if (category) query.set('category', category);

  const response = await fetch(`${API_URL}/markets?${query}`, {
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`Market API returned ${response.status}`);
  }

  return response.json();
}

export async function getAllServerMarkets(
  params: Omit<GetServerMarketsParams, 'limit' | 'offset'> = {}
): Promise<Market[]> {
  const markets: Market[] = [];
  const limit = 100;

  for (let offset = 0; ; offset += limit) {
    const batch = await getServerMarkets({ ...params, limit, offset });
    markets.push(...batch);
    if (batch.length < limit) return markets;
  }
}

export const getServerMarket = cache(async (id: string): Promise<Market | null> => {
  if (!UUID_PATTERN.test(id)) return null;

  if (!API_URL) {
    throw new Error('Market API URL is not configured');
  }

  const response = await fetch(`${API_URL}/markets/${encodeURIComponent(id)}`, {
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(5000),
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error(`Market API returned ${response.status}`);
  }

  return response.json();
});
