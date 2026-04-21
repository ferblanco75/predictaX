'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';
import type { Market, MarketCategory, MarketStatus } from '@/lib/types';

interface UseMarketsParams {
  category?: MarketCategory | 'all';
  status?: MarketStatus | 'all';
  limit?: number;
  offset?: number;
}

export function useMarkets(params: UseMarketsParams = {}) {
  const { category, status = 'active', limit = 20, offset = 0 } = params;

  return useQuery<Market[]>({
    queryKey: ['markets', { category, status, limit, offset }],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (category && category !== 'all') query.set('category', category);
      if (status && status !== 'all') query.set('status', status);
      query.set('limit', String(limit));
      query.set('offset', String(offset));
      const res = await api.get<Market[]>(`/markets?${query}`);
      return res.data;
    },
  });
}

export function useMarket(id: string) {
  return useQuery<Market>({
    queryKey: ['market', id],
    queryFn: async () => {
      const res = await api.get<Market>(`/markets/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}
