import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MarketCategory, MarketStatus } from '@/lib/types';

interface User {
  id: string;
  username: string;
  email: string;
  points: number;
  avatarUrl?: string;
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
      logout: () => set({ isLoggedIn: false, user: null }),
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
      name: 'predictax-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
      }), // Only persist auth state, not filters
    }
  )
);
