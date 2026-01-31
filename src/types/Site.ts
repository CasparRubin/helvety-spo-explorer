/**
 * Branded type for Site ID to prevent mixing with Web ID
 */
export type SiteId = string & { readonly __brand: "SiteId" };

/**
 * Branded type for Web ID to prevent mixing with Site ID
 */
export type WebId = string & { readonly __brand: "WebId" };

/**
 * SharePoint site information
 */
export interface ISite {
  /** Site ID (branded type to prevent mixing with Web ID) */
  id: SiteId;
  /** Site title/name */
  title: string;
  /** Site URL */
  url: string;
  /** Site description */
  description?: string;
  /** Site icon URL */
  iconUrl?: string;
  /** Web ID (branded type to prevent mixing with Site ID) */
  webId?: WebId;
  /** Site collection URL */
  siteCollectionUrl?: string;
}

/**
 * SharePoint search result cell
 */
export interface ISearchResultCell {
  Key: string;
  Value: string;
}

/**
 * SharePoint search result row
 *
 * This interface represents a single row from the SharePoint Search API response.
 * The Cells array contains key-value pairs for each property returned by the search query.
 */
export interface ISiteSearchResultRow {
  /** Array of key-value pairs representing the search result properties */
  Cells: readonly ISearchResultCell[];
}

/**
 * SharePoint REST API response for web infos
 *
 * Represents web information returned by the SharePoint WebInfos API endpoint.
 */
export interface IWebInfo {
  /** Web ID */
  Id: string;
  /** Web title */
  Title: string;
  /** Web absolute URL */
  Url: string;
  /** Web description */
  Description: string;
  /** Web server-relative URL */
  ServerRelativeUrl: string;
  /** Web template name */
  WebTemplate: string;
  /** Web template ID */
  WebTemplateId: number;
}

/**
 * SharePoint REST API response wrapper
 *
 * Standard response format for SharePoint REST API endpoints that return collections.
 */
export interface ISPRestResponse<T> {
  /** Array of items returned by the API */
  value: readonly T[];
}

/**
 * Error response from SharePoint API
 */
export interface ISPApiError {
  error: {
    code: string;
    message: {
      lang: string;
      value: string;
    };
  };
}
