import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MarketCategory, MarketStatus } from '@/lib/types';

interface User {
  id: string;
  username: string;
  email: string;
  points: number;
  role: string;
  avatarUrl?: string;
  token?: string;
}

interface AppState {
  // Auth state
  isLoggedIn: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;

  // Market filters
  selectedCategory: MarketCategory | 'all';
  selectedStatus: MarketStatus | 'all';
  searchQuery: string;
  setCategory: (category: MarketCategory | 'all') => void;
  setStatus: (status: MarketStatus | 'all') => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;

  // User actions (mock)
  addPoints: (amount: number) => void;
  deductPoints: (amount: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      isLoggedIn: false,
      user: null,
      selectedCategory: 'all',
      selectedStatus: 'all',
      searchQuery: '',

      // Actions
      login: (user) => set({ isLoggedIn: true, user }),
      // #259: logout previously only cleared in-memory state — the JWT
      // stayed in localStorage until its 30-minute expiry. Navbar.tsx and
      // settings/privacy/page.tsx already did this themselves; centralizing
      // it here means every caller of logout() gets it for free.
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        set({ isLoggedIn: false, user: null });
      },
      setCategory: (category) => set({ selectedCategory: category }),
      setStatus: (status) => set({ selectedStatus: status }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      resetFilters: () => set({ selectedCategory: 'all', selectedStatus: 'all', searchQuery: '' }),
      addPoints: (amount) =>
        set((state) => ({
          user: state.user ? { ...state.user, points: state.user.points + amount } : null,
        })),
      deductPoints: (amount) =>
        set((state) => ({
          user: state.user ? { ...state.user, points: state.user.points - amount } : null,
        })),
    }),
    {
      name: 'neuropredict-storage', // localStorage key
      // #259: the JWT already lives in localStorage.token (read by the
      // axios interceptor in lib/api/client.ts) — persisting it a second
      // time here meant it existed in two places under two different keys.
      partialize: (state) => ({
        user: state.user ? { ...state.user, token: undefined } : null,
        isLoggedIn: state.isLoggedIn,
      }), // Only persist auth state, not filters
    }
  )
);
