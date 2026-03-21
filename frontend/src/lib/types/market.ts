export type MarketCategory = 'economia' | 'politica' | 'deportes' | 'tecnologia' | 'crypto';

export type MarketStatus = 'active' | 'resolved';

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
