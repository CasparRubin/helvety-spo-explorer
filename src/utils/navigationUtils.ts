/**
 * Navigation utility functions
 * 
 * Provides shared navigation functionality for the application.
 */

import { logWarning, logError } from './errorUtils';
import { isValidUrl, isNonEmptyString } from './validationUtils';

const LOG_SOURCE = 'navigationUtils';

/**
 * Navigate to a site URL
 * 
 * Opens a URL in either the current tab or a new tab based on the openInNewTab parameter.
 * Validates the URL before navigation to prevent navigation to invalid URLs.
 * This is a pure utility function that can be used across the application.
 * 
 * @param url - The site URL to navigate to
 * @param openInNewTab - If true, opens the URL in a new tab; otherwise opens in current tab
 * @throws Never throws - invalid URLs are handled gracefully (no navigation occurs)
 * 
 * @example
 * ```typescript
 * navigateToSite('https://contoso.sharepoint.com/sites/mysite', true);
 * // Opens in new tab
 * 
 * navigateToSite('https://contoso.sharepoint.com/sites/mysite', false);
 * // Opens in current tab
 * ```
 */
export function navigateToSite(url: string, openInNewTab?: boolean): void {
  // Validate input using validation utility
  if (!isNonEmptyString(url)) {
    return;
  }

  const trimmedUrl: string = url.trim();

  // Validate URL before navigation
  if (!isValidUrl(trimmedUrl)) {
    // Log warning but don't throw - fail silently to prevent breaking the UI
    logWarning(LOG_SOURCE, `Invalid URL provided to navigateToSite: ${trimmedUrl}`, 'navigateToSite');
    return;
  }

  try {
    if (openInNewTab) {
      window.open(trimmedUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = trimmedUrl;
    }
  } catch (error: unknown) {
    // Handle navigation errors gracefully
    logError(LOG_SOURCE, error, `Error navigating to URL: ${trimmedUrl}`);
  }
}
