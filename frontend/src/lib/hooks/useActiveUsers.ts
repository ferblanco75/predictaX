'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';

export function useActiveUsers() {
  return useQuery<number>({
    queryKey: ['active-users'],
    queryFn: async () => {
      const res = await api.get<{ active_users: number }>('/users/active-count');
      return res.data.active_users;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
