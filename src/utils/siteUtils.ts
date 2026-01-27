import { ISite } from '../types/Site';

/**
 * Site utility functions
 */

/**
 * Sort sites alphabetically by title (case-insensitive)
 * 
 * Sorts an array of sites by their title using locale-aware comparison.
 * Uses case-insensitive comparison to ensure consistent ordering regardless of capitalization.
 * Creates a new array to avoid mutating the input.
 * 
 * Defensive checks:
 * - Validates input is an array
 * - Handles null/undefined titles safely
 * - Validates title is a string before comparison
 * 
 * @param sites - Array of sites to sort
 * @returns New array with sites sorted alphabetically by title
 * @throws Never throws - localeCompare is safe, defensive checks prevent errors
 * 
 * @example
 * ```typescript
 * const sorted = sortSitesAlphabetically(sites);
 * // Input: [{ title: 'Zebra' }, { title: 'apple' }, { title: 'Banana' }]
 * // Output: [{ title: 'apple' }, { title: 'Banana' }, { title: 'Zebra' }]
 * ```
 */
export function sortSitesAlphabetically(sites: ISite[]): ISite[] {
  // Defensive check: validate input is an array
  if (!Array.isArray(sites)) {
    return [];
  }

  // Create a copy to avoid mutating the input array
  return [...sites].sort((a, b) => {
    // Defensive checks: validate sites and titles exist
    if (!a || !b) {
      return 0; // Keep order if either site is invalid
    }

    const titleA = typeof a.title === 'string' ? a.title : '';
    const titleB = typeof b.title === 'string' ? b.title : '';

    // Use 'base' sensitivity for case-insensitive comparison
    // This treats 'A' and 'a' as equivalent for sorting purposes
    return titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
  });
}
