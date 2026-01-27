import * as React from 'react';
import { ISite } from '../types/Site';
import { highlightMarkStyle } from './styles';

/**
 * Component utility functions for common patterns
 * 
 * This module provides reusable utility functions and hooks that are commonly
 * used across multiple components to reduce code duplication and ensure consistency.
 */

/**
 * Performs a shallow equality check between two objects
 * 
 * Compares two objects by checking if all their properties are equal using strict equality (===).
 * This is useful for React state updates to prevent unnecessary re-renders.
 * 
 * Input validation:
 * - Validates both inputs are objects
 * - Handles null/undefined values
 * - Handles arrays (arrays are objects but compared differently)
 * 
 * @param obj1 - First object to compare
 * @param obj2 - Second object to compare
 * @returns true if objects are shallowly equal, false otherwise
 * @throws Never throws - returns false on invalid input
 * 
 * @example
 * ```typescript
 * const prev = { a: 1, b: 2 };
 * const next = { a: 1, b: 2 };
 * shallowEqual(prev, next); // Returns: true
 * 
 * const prev2 = { a: 1, b: 2 };
 * const next2 = { a: 1, b: 3 };
 * shallowEqual(prev2, next2); // Returns: false
 * ```
 */
export function shallowEqual<T extends object>(
  obj1: T, 
  obj2: T
): boolean {
  // Fast path: same reference means equal
  if (obj1 === obj2) {
    return true;
  }
  
  // Validate inputs are objects (not null, not undefined, not primitives)
  if (obj1 === null || obj2 === null || obj1 === undefined || obj2 === undefined) {
    return false;
  }
  
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return false;
  }
  
  // Arrays should not be compared with shallowEqual (use array comparison instead)
  if (Array.isArray(obj1) || Array.isArray(obj2)) {
    return false;
  }
  
  const keys1 = Object.keys(obj1) as Array<keyof T>;
  const keys2 = Object.keys(obj2) as Array<keyof T>;
  
  // Different number of keys means not equal
  if (keys1.length !== keys2.length) {
    return false;
  }
  
  // Compare each property value
  for (const key of keys1) {
    // Check if key exists in obj2 and values are equal
    if (!(key in obj2) || obj1[key] !== obj2[key]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Creates a memoized site URL in lowercase for efficient comparison
 * 
 * This hook memoizes the lowercase version of a site URL to avoid repeated
 * string operations. Useful when the URL needs to be compared multiple times
 * (e.g., checking favorite status).
 * 
 * @param siteUrl - The site URL to memoize
 * @returns Memoized lowercase URL string
 * 
 * @example
 * ```typescript
 * const siteUrlLower = useSiteUrlLower(site.url);
 * const isFavorite = favoriteSites.has(siteUrlLower);
 * ```
 */
export function useSiteUrlLower(siteUrl: string): string {
  return React.useMemo((): string => siteUrl.toLowerCase(), [siteUrl]);
}

/**
 * Checks if a site matches search criteria
 * 
 * Performs a case-insensitive search across the site's title, description, and URL.
 * Returns true if any of these fields contain the search text.
 * 
 * Input validation:
 * - Validates site is a valid object
 * - Validates searchText is a string
 * - Handles null/undefined values safely
 * 
 * @param site - The site to check
 * @param searchText - The search text (will be lowercased internally)
 * @returns true if the site matches the search criteria, false otherwise
 * @throws Never throws - returns false on invalid input
 * 
 * @example
 * ```typescript
 * const filteredSites = sites.filter(site => siteMatchesSearch(site, 'sharepoint'));
 * // Returns all sites with 'sharepoint' in title, description, or URL
 * ```
 */
export function siteMatchesSearch(site: ISite, searchText: string): boolean {
  // Validate inputs with defensive checks
  if (!site || typeof site !== 'object' || site === null) {
    return false;
  }
  
  if (typeof searchText !== 'string') {
    return false;
  }
  
  // Empty search matches all sites
  if (!searchText.trim()) {
    return true;
  }

  const searchLower: string = searchText.toLowerCase();
  
  // Validate site properties exist and are strings before searching
  // Use optional chaining and type guards for safe property access
  const titleMatch: boolean = 
    typeof site.title === 'string' && 
    site.title.length > 0 &&
    site.title.toLowerCase().includes(searchLower);
    
  const descriptionMatch: boolean = 
    typeof site.description === 'string' && 
    site.description.length > 0 &&
    site.description.toLowerCase().includes(searchLower);
    
  const urlMatch: boolean = 
    typeof site.url === 'string' && 
    site.url.length > 0 &&
    site.url.toLowerCase().includes(searchLower);
  
  return titleMatch || descriptionMatch || urlMatch;
}

/**
 * Creates a safe event handler that prevents default and stops propagation
 * 
 * Wraps an event handler to automatically prevent default behavior and stop
 * event propagation. Useful for buttons and interactive elements within
 * clickable containers to prevent unwanted event bubbling.
 * 
 * @param handler - The handler function to wrap
 * @returns Wrapped event handler that prevents default and stops propagation
 * 
 * @example
 * ```typescript
 * const handleClick = createSafeEventHandler((e) => {
 *   // Handle click event
 *   doSomething();
 * });
 * 
 * <div onClick={handleClick}>Click me</div>
 * ```
 */
export function createSafeEventHandler<
  T extends React.SyntheticEvent<HTMLElement, Event>
>(
  handler: (e: T) => void
): (e: T) => void {
  return (e: T): void => {
    e.preventDefault();
    e.stopPropagation();
    handler(e);
  };
}

/**
 * Highlights matching text in search results
 * 
 * Uses case-insensitive string matching to find and highlight search terms.
 * Avoids regex for security reasons (prevents ReDoS attacks).
 * Only highlights the first match found in the text.
 * 
 * This is a pure function that can be used outside React components for better performance.
 * 
 * Input validation:
 * - Validates text is a string (converts to string if not)
 * - Validates searchText is a non-empty string
 * - Handles null/undefined values safely
 * - Validates string bounds before substring operations
 * 
 * @param text - The text to search and highlight within
 * @param searchText - The search text to highlight
 * @returns JSX element with highlighted match wrapped in <mark> tag, or plain text if no match
 * @throws Never throws - returns plain text if highlighting fails
 * 
 * @example
 * ```typescript
 * highlightText('SharePoint Site', 'point')
 * // Returns: <>{'Share'} <mark>Point</mark> {' Site'}</>
 * ```
 */
export function highlightText(text: string, searchText: string): React.ReactElement {
  // Fast path: empty search text returns original text
  if (!searchText || typeof searchText !== 'string' || !searchText.trim()) {
    const textStr: string = typeof text === 'string' ? text : String(text ?? '');
    return React.createElement(React.Fragment, null, textStr);
  }
  
  // Validate inputs with defensive checks
  // Convert non-string text to string for safety
  const textStr: string = typeof text === 'string' ? text : String(text ?? '');
  
  // Fast path: empty text returns empty fragment
  if (!textStr) {
    return React.createElement(React.Fragment, null, '');
  }
  
  // Use case-insensitive string matching to avoid regex security concerns
  // This prevents ReDoS (Regular Expression Denial of Service) attacks
  const textLower: string = textStr.toLowerCase();
  const searchLower: string = searchText.toLowerCase();
  
  // Use indexOf instead of includes because we need the index position to extract
  // the parts before, during, and after the match for highlighting
  const matchIndex: number = textLower.indexOf(searchLower);
  
  // Fast path: no match found
  if (matchIndex === -1) {
    return React.createElement(React.Fragment, null, textStr);
  }
  
  // Validate matchIndex is within bounds before extracting substrings
  // This prevents out-of-bounds errors
  if (matchIndex < 0 || matchIndex >= textStr.length) {
    return React.createElement(React.Fragment, null, textStr);
  }
  
  // Extract parts: text before match, the match itself, and text after match
  // Use Math.min to ensure we don't exceed string bounds
  const beforeMatch: string = textStr.substring(0, matchIndex);
  const matchLength: number = Math.min(searchText.length, textStr.length - matchIndex);
  const match: string = textStr.substring(matchIndex, matchIndex + matchLength);
  const afterMatch: string = textStr.substring(matchIndex + matchLength);
  
  const markElement: React.ReactElement = React.createElement(
    'mark',
    {
      style: highlightMarkStyle,
      'aria-label': `Highlighted match: ${match}`,
    },
    match
  );
  
  return React.createElement(
    React.Fragment,
    null,
    beforeMatch,
    markElement,
    afterMatch
  );
}
