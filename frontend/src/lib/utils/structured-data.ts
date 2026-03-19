import type { Market } from '@/lib/types';

/**
 * Generate JSON-LD structured data for a market
 * Uses schema.org Question type
 */
export function generateMarketStructuredData(market: Market) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Question',
    name: market.title,
    text: market.description,
    dateCreated: market.history[0]?.date || new Date().toISOString(),
    dateModified: market.history[market.history.length - 1]?.date || new Date().toISOString(),
    answerCount: market.participants,
    author: {
      '@type': 'Organization',
      name: 'PredictaX',
    },
    about: {
      '@type': 'Thing',
      name: market.category,
    },
  };
}

/**
 * Generate JSON-LD structured data for the organization
 */
export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PredictaX',
    url: 'https://predictax.com',
    logo: 'https://predictax.com/logo.png',
    description:
      'Plataforma de mercados de predicción de América Latina sobre economía, política, deportes y tecnología.',
    sameAs: [
      // Add social media links here when available
    ],
  };
}

/**
 * Generate JSON-LD breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
