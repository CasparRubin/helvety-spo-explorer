/**
 * SharePoint Search API endpoints and query parameters
 */

/**
 * SharePoint REST API endpoints
 */
export const API_ENDPOINTS = {
  /** SharePoint Search API endpoint for querying sites (POST) */
  SEARCH_POSTQUERY: '/_api/search/postquery',
} as const;

/**
 * SharePoint Search API query parameters
 */
export const SEARCH_QUERY_PARAMS = {
  /** Query text to search for sites (contentclass:STS_Site) */
  QUERY_TEXT: 'contentclass:STS_Site',
  /** Properties to select from Search API response (optimizes response size) */
  SELECT_PROPERTIES: ['Title', 'Path', 'Description', 'SiteId', 'WebId', 'SiteCollectionUrl'],
  /** Maximum number of results per page (Search API supports up to 500) */
  ROW_LIMIT: 500,
  /** Whether to trim duplicate results */
  TRIM_DUPLICATES: false,
} as const;

/**
 * Default site title when missing
 */
export const DEFAULT_SITE_TITLE = 'Untitled Site';
