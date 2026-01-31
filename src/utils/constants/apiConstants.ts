/**
 * SharePoint Search API endpoints and query parameters
 */

/**
 * SharePoint REST API endpoints
 */
export const API_ENDPOINTS = {
  /** SharePoint Search API endpoint for querying sites (POST) */
  SEARCH_POSTQUERY: "/_api/search/postquery",
} as const;

/**
 * SharePoint Search API query parameters
 */
export const SEARCH_QUERY_PARAMS = {
  /** Query text to search for sites (contentclass:STS_Site) */
  QUERY_TEXT: "contentclass:STS_Site",
  /** Properties to select from Search API response (optimizes response size) */
  SELECT_PROPERTIES: [
    "Title",
    "Path",
    "Description",
    "SiteId",
    "WebId",
    "SiteCollectionUrl",
  ],
  /** Maximum number of results per page (Search API supports up to 500) */
  ROW_LIMIT: 500,
  /** Whether to trim duplicate results */
  TRIM_DUPLICATES: false,
} as const;

/**
 * Default site title when missing
 */
export const DEFAULT_SITE_TITLE = "Untitled Site";

/**
 * License validation API configuration
 */
export const LICENSE_API = {
  /** Base URL for the Helvety Store API */
  BASE_URL: "https://store.helvety.com/api",
  /** License validation endpoint */
  VALIDATE_ENDPOINT: "/license/validate",
} as const;

/**
 * License cache configuration
 *
 * Cache strategy:
 * - Valid licenses: Cache for 24 hours (enterprise customers shouldn't be bothered)
 * - Invalid licenses: Cache for 1 hour (so they can re-check after purchasing)
 * - Grace period: 7 days (for offline/network issues)
 */
export const LICENSE_CACHE = {
  /** localStorage key prefix for license cache */
  KEY: "helvety-spo-explorer-license",
  /** Cache duration for VALID licenses (24 hours - enterprise friendly) */
  VALID_DURATION_MS: 24 * 60 * 60 * 1000,
  /** Cache duration for INVALID licenses (1 hour - allows re-check after purchase) */
  INVALID_DURATION_MS: 60 * 60 * 1000,
  /** Legacy: Default cache duration (for backwards compatibility) */
  DURATION_MS: 60 * 60 * 1000,
  /** Grace period for using stale cache when offline (7 days) */
  GRACE_PERIOD_MS: 7 * 24 * 60 * 60 * 1000,
} as const;
