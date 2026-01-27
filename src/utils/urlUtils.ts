/**
 * URL utility functions
 */

/**
 * Extract the partial URL (pathname) from a full URL
 * 
 * Extracts only the path portion of a URL, excluding the protocol, domain, and query parameters.
 * For example: "https://helvety.sharepoint.com/sites/allcompany" -> "/sites/allcompany"
 * 
 * Handles errors from:
 * - new URL() constructor - may throw TypeError for invalid URL format
 * 
 * @param fullUrl - The full URL to extract the path from
 * @returns The pathname portion of the URL, or the original URL if parsing fails
 * @throws Never throws - returns original URL if URL parsing fails (errors are caught)
 * 
 * @example
 * ```typescript
 * getPartialUrl('https://helvety.sharepoint.com/sites/allcompany')
 * // Returns: '/sites/allcompany'
 * ```
 */
export function getPartialUrl(fullUrl: string): string {
  if (!fullUrl || typeof fullUrl !== 'string') {
    return fullUrl || '';
  }

  try {
    const url = new URL(fullUrl);
    return url.pathname;
  } catch {
    // If URL parsing fails (e.g., invalid URL format), return the original URL
    return fullUrl;
  }
}

/**
 * Normalize a URL for consistent storage and comparison
 * 
 * Normalizes a URL by trimming whitespace, converting to lowercase, and removing trailing slashes
 * (except for root URLs). This ensures consistent comparison and storage of URLs across the application.
 * 
 * Handles errors from:
 * - String operations (trim, toLowerCase, endsWith, slice) - should not throw but caught for safety
 * 
 * @param url - The URL to normalize
 * @returns Normalized URL (lowercase, trimmed, trailing slash removed if not root)
 * @throws Never throws - always returns a string (original trimmed if normalization fails)
 * 
 * @example
 * ```typescript
 * normalizeUrl('https://contoso.sharepoint.com/sites/mysite/')
 * // Returns: 'https://contoso.sharepoint.com/sites/mysite'
 * 
 * normalizeUrl('https://contoso.sharepoint.com/')
 * // Returns: 'https://contoso.sharepoint.com/'
 * ```
 */
export function normalizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return url || '';
  }

  try {
    let normalized: string = url.trim().toLowerCase();
    // Remove trailing slash unless it's the root URL (length <= 1 means just "/")
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    // If normalization fails (shouldn't happen), return trimmed original URL
    return url.trim();
  }
}
