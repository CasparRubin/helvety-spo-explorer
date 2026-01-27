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
 * @param sites - Array of sites to sort
 * @returns New array with sites sorted alphabetically by title
 * @throws Never throws - localeCompare is safe
 * 
 * @example
 * ```typescript
 * const sorted = sortSitesAlphabetically(sites);
 * // Input: [{ title: 'Zebra' }, { title: 'apple' }, { title: 'Banana' }]
 * // Output: [{ title: 'apple' }, { title: 'Banana' }, { title: 'Zebra' }]
 * ```
 */
export function sortSitesAlphabetically(sites: ISite[]): ISite[] {
  // Create a copy to avoid mutating the input array
  return [...sites].sort((a, b) => {
    // Use 'base' sensitivity for case-insensitive comparison
    // This treats 'A' and 'a' as equivalent for sorting purposes
    return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  });
}
