/**
 * API Layer for Markets
 *
 * This layer provides an abstraction over the data access layer,
 * making it easier to switch to a real API in the future without
 * changing component code.
 */

import {
  markets,
  getMarketById as dataGetMarketById,
  getMarketsByCategory as dataGetMarketsByCategory,
  getActiveMarkets as dataGetActiveMarkets,
  getResolvedMarkets as dataGetResolvedMarkets,
  getRelatedMarkets as dataGetRelatedMarkets,
  getTrendingMarkets as dataGetTrendingMarkets,
} from '@/lib/data/markets';
import type { Market, MarketCategory } from '@/lib/types';

/**
 * Get all markets
 */
export function getAllMarkets(): Market[] {
  return markets;
}

/**
 * Get a single market by ID
 */
export function getMarketById(id: string): Market | undefined {
  return dataGetMarketById(id);
}

/**
 * Get markets filtered by category
 */
export function getMarketsByCategory(category: MarketCategory): Market[] {
  return dataGetMarketsByCategory(category);
}

/**
 * Get only active markets
 */
export function getActiveMarkets(): Market[] {
  return dataGetActiveMarkets();
}

/**
 * Get only resolved markets
 */
export function getResolvedMarkets(): Market[] {
  return dataGetResolvedMarkets();
}

/**
 * Get trending markets sorted by volume
 */
export function getTrendingMarkets(limit: number = 6): Market[] {
  return dataGetTrendingMarkets(limit);
}

/**
 * Get related markets for a given market
 */
export function getRelatedMarkets(marketId: string): Market[] {
  return dataGetRelatedMarkets(marketId);
}

/**
 * Search markets by query string
 * Searches in title and description (case-insensitive)
 */
export function searchMarkets(query: string): Market[] {
  if (!query || query.trim() === '') {
    return markets;
  }

  const lowerQuery = query.toLowerCase().trim();

  return markets.filter((market) => {
    const titleMatch = market.title.toLowerCase().includes(lowerQuery);
    const descriptionMatch = market.description.toLowerCase().includes(lowerQuery);
    return titleMatch || descriptionMatch;
  });
}
