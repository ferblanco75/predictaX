'use client';

import { useAppStore } from '@/lib/stores/app-store';

/**
 * Returns the admin JWT token, reading from Zustand store with fallback to
 * localStorage. This handles the case where SessionValidator refreshes user
 * data without preserving the token in the store (race condition on mount).
 */
export function useAdminToken(): string | null {
  const user = useAppStore((s) => s.user);
  if (user?.token) return user.token;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}
