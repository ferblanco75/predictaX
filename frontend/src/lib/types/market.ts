export type MarketCategory = 'economia' | 'politica' | 'deportes' | 'tecnologia' | 'crypto';

export type MarketStatus = 'active' | 'resolved';

export interface MarketHistoryPoint {
  date: string;
  probability: number;
}

export interface Market {
  id: string;
  title: string;
  description: string;
  category: MarketCategory;
  probability: number;
  volume: string;
  participants: number;
  endDate: string;
  status: MarketStatus;
  history: MarketHistoryPoint[];
  relatedMarkets: string[];
}

export interface Category {
  id: MarketCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  count: number;
}
