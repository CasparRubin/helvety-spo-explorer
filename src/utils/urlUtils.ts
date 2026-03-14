/**
 * URL utility functions
 */

import { isNonEmptyString } from "./validationUtils";

const ALLOWED_SCHEME = "https:";

function isAllowedSharePointHost(hostname: string): boolean {
  const normalizedHost = hostname.toLowerCase();
  return (
    normalizedHost === "sharepoint.com" ||
    normalizedHost.endsWith(".sharepoint.com")
  );
}

/**
 * Result of URL validation and normalization
 */
export interface IUrlValidationResult {
  /** Whether the URL is valid */
  isValid: boolean;
  /** Normalized URL (empty string if invalid) */
  normalizedUrl: string;
  /** Original URL */
  originalUrl: string;
}

/**
 * Extract the partial URL (pathname) from a full URL
 *
 * Extracts only the path portion of a URL, excluding the protocol, domain, and query parameters.
 * For example: "https://helvety.sharepoint.com/sites/allcompany" -> "/sites/allcompany"
 *
 * Defensive checks:
 * - Validates input is a non-empty string
 * - Handles relative URLs (starting with /)
 * - Validates URL parsing result before returning
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
  // Defensive check: validate input using validation utility
  if (!isNonEmptyString(fullUrl)) {
    return "";
  }

  // Handle relative URLs (already a pathname)
  if (fullUrl.startsWith("/")) {
    return fullUrl;
  }

  try {
    const url = new URL(fullUrl);
    // Defensive check: validate pathname exists and is a string
    const pathname = url.pathname;
    return typeof pathname === "string" ? pathname : fullUrl;
  } catch {
    // If URL parsing fails (e.g., invalid URL format), return the original URL
    return fullUrl;
  }
}

/**
 * Normalize a URL for consistent storage and comparison
 *
 * Normalizes a URL by enforcing HTTPS + SharePoint host allowlist, converting to lowercase,
 * and removing trailing slashes (except root URLs).
 *
 * Defensive checks:
 * - Validates input is a non-empty string
 * - Validates string length before slice operations
 * - Handles edge cases (empty strings, single character strings)
 *
 * Handles errors from:
 * - URL parsing (`new URL`) and string operations; invalid URLs return empty string
 *
 * @param url - The URL to normalize
 * @returns Normalized URL, or empty string when URL is invalid/disallowed
 * @throws Never throws - always returns a string
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
  // Defensive check: validate input using validation utility
  if (!isNonEmptyString(url)) {
    return "";
  }

  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== ALLOWED_SCHEME) {
      return "";
    }
    if (!isAllowedSharePointHost(parsed.hostname)) {
      return "";
    }

    let normalized: string = parsed.toString().toLowerCase();

    // Defensive check: validate length before slice operation
    // Remove trailing slash unless it's the root URL (length <= 1 means just "/")
    if (normalized.length > 1 && normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }

    // Defensive check: ensure result is still a valid string
    return typeof normalized === "string" ? normalized : url.trim();
  } catch {
    // Reject malformed URLs.
    return "";
  }
}

/**
 * Validates and normalizes a URL in one operation
 *
 * Combines strict normalization and validation for convenience. Only HTTPS SharePoint
 * URLs pass validation.
 *
 * @param url - The URL to validate and normalize
 * @returns Object containing validation result and normalized URL
 *
 * @example
 * ```typescript
 * const result = validateAndNormalizeUrl('https://contoso.sharepoint.com/sites/mysite/');
 * if (result.isValid) {
 *   // Use result.normalizedUrl
 * }
 * ```
 */
export function validateAndNormalizeUrl(url: string): IUrlValidationResult {
  const originalUrl = url;

  if (!isNonEmptyString(url)) {
    return {
      isValid: false,
      normalizedUrl: "",
      originalUrl,
    };
  }

  const normalizedUrl = normalizeUrl(url);
  const isValid = normalizedUrl.length > 0;

  return {
    isValid,
    normalizedUrl: isValid ? normalizedUrl : "",
    originalUrl,
  };
}
