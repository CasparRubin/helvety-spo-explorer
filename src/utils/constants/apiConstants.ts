/**
 * SharePoint API endpoints and query parameters
 */

/**
 * SharePoint API endpoints
 */
export const API_ENDPOINTS = {
  SEARCH_QUERY: '/_api/search/query',
  WEB_INFOS: '/_api/web/webinfos',
} as const;

/**
 * SharePoint Search API query parameters
 */
export const SEARCH_QUERY_PARAMS = {
  QUERY_TEXT: "contentclass:STS_Site OR contentclass:STS_Web",
  SELECT_PROPERTIES: 'Title,Path,Description,SiteId,WebId,SiteCollectionUrl',
  ROW_LIMIT: 500,
} as const;

/**
 * Default site title when missing
 */
export const DEFAULT_SITE_TITLE = 'Untitled Site';
