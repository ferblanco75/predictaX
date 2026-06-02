'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { useAppStore } from '@/lib/stores/app-store';

interface UserPrediction {
  id: string;
  market_id: string;
  probability: number;
  points_wagered: number;
  potential_gain: number | null;
  status: 'pending' | 'won' | 'lost';
  created_at: string;
}

export function useUserPredictions() {
  const { isLoggedIn } = useAppStore();

  return useQuery<UserPrediction[]>({
    queryKey: ['user-predictions'],
    queryFn: async () => {
      const res = await api.get<UserPrediction[]>('/predictions');
      return res.data;
    },
    enabled: isLoggedIn,
    staleTime: 30_000,
  });
}
