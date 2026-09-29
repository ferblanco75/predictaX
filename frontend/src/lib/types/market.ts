export type MarketCategory = 'economia' | 'politica' | 'deportes' | 'tecnologia' | 'crypto';

export type MarketStatus = 'active' | 'resolved' | 'cancelled';

export type MarketType = 'binary' | 'multiple_choice' | 'numeric';

export interface MarketHistoryPoint {
  date: string;
  probability: number;
}

export interface MultipleChoiceOption {
  id: string;
  label: string;
  probability: number;
  history?: MarketHistoryPoint[];
}

export interface Market {
  id: string;
  title: string;
  description: string;
  category: MarketCategory;
  type: MarketType;
  probability: number;
  volume: string;
  participants: number;
  endDate: string;
  status: MarketStatus;
  history: MarketHistoryPoint[];
  relatedMarkets: string[];
  statsData?: Record<string, unknown> | null;
  fixtureId?: number | null;
  // Total points wagered on each side (#306) — lets the prediction form
  // preview the post-trade payout instead of pricing off the pre-trade probability.
  // Optional: the mock data in lib/data/markets.ts predates this field.
  yesPoints?: number;
  noPoints?: number;
  // For multiple_choice type
  options?: MultipleChoiceOption[];
}

export interface Category {
  id: MarketCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  count: number;
}
