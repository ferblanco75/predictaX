import type { Category } from '../types/market';

/**
 * Keeps only categories not explicitly hidden. A category missing from
 * `visibility` (endpoint unreachable, or never toggled) is treated as
 * visible — fail-open, matching the backend default.
 */
export function filterVisibleCategories(
  categories: Category[],
  visibility: Record<string, boolean>
): Category[] {
  return categories.filter((category) => visibility[category.id] !== false);
}
