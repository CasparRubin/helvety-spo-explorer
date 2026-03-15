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
    "DocId",
  ],
  /** Maximum number of results per request page (total results can exceed this via paging) */
  ROW_LIMIT: 500,
  /** Maximum supported StartRow value before switching to IndexDocId paging */
  START_ROW_MAX: 50000,
  /** Sort property used for IndexDocId paging */
  DOC_ID_SORT_PROPERTY: "[docid]",
  /** Sort direction used for IndexDocId paging */
  DOC_ID_SORT_DIRECTION: "Ascending",
  /** Whether to trim duplicate results */
  TRIM_DUPLICATES: false,
} as const;

/**
 * Default site title when missing
 */
export const DEFAULT_SITE_TITLE = "Untitled Site";
