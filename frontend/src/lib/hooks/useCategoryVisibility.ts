'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';

interface CategoryVisibilityRow {
  category: string;
  is_visible: boolean;
}

/**
 * Client-side mirror of getServerVisibleCategories (server-markets.ts), for
 * components that render globally as client components (e.g. Navbar) and
 * can't await a server fetch. Fails open (empty map — nothing hidden) while
 * loading or on error, same criterion as the server-side version.
 */
export function useCategoryVisibility(): Record<string, boolean> {
  const { data } = useQuery<Record<string, boolean>>({
    queryKey: ['categories-visibility'],
    queryFn: async () => {
      const res = await api.get<CategoryVisibilityRow[]>('/markets/categories/visibility');
      return Object.fromEntries(res.data.map((row) => [row.category, row.is_visible]));
    },
    staleTime: 5 * 60 * 1000,
  });

  return data ?? {};
}
