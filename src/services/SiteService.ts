import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";
import { ApplicationCustomizerContext } from "@microsoft/sp-application-base";
import { ISite, ISiteSearchResultRow, ISearchResultCell, ISPRestResponse, IWebInfo, SiteId, WebId } from "../types/Site";
import { logError, logWarning, extractErrorMessage, parseApiError, categorizeError, ErrorCategory } from '../utils/errorUtils';
import { ApiError, PermissionError, ValidationError } from '../utils/errors';
import { CACHE_CONFIG, API_ENDPOINTS, SEARCH_QUERY_PARAMS, DEFAULT_SITE_TITLE, ERROR_MESSAGES } from '../utils/constants';
import { navigateToSite as navigateToSiteUtil } from '../utils/navigationUtils';

const LOG_SOURCE = 'SiteService';

/**
 * Service for fetching SharePoint sites using REST API
 * 
 * This service provides methods to retrieve SharePoint sites that the current user has access to.
 * It uses the SharePoint Search API as the primary method and falls back to the WebInfos API
 * if the search API is unavailable. Results are cached for 5 minutes to improve performance.
 * 
 * @example
 * ```typescript
 * const siteService = new SiteService(context);
 * const sites = await siteService.getSites();
 * ```
 */
export class SiteService {
  private context: ApplicationCustomizerContext;
  private cache: ISite[] | null = null;
  private cacheTimestamp: number = 0;

  /**
   * Creates a new instance of SiteService
   * @param context - The SharePoint application customizer context
   */
  constructor(context: ApplicationCustomizerContext) {
    this.context = context;
  }

  /**
   * Get all sites the current user has access to
   * Uses SharePoint Search API as primary method, falls back to webinfos if needed
   * Results are cached for 5 minutes to improve performance
   * @returns A promise that resolves to an array of ISite objects
   * @throws Error if both API methods fail
   */
  public async getSites(): Promise<ISite[]> {
    // Check cache first
    const now = Date.now();
    if (this.cache && (now - this.cacheTimestamp) < CACHE_CONFIG.DURATION_MS) {
      return this.cache;
    }

    try {
      // Try search API first (better for large tenants)
      const sites: ISite[] = await this.getSitesFromSearch();
      if (sites.length > 0) {
        this.cache = sites;
        this.cacheTimestamp = now;
        return sites;
      }
      // If search API returns empty results, fall through to webinfos API
      logWarning(LOG_SOURCE, 'Search API returned no results, falling back to WebInfos API', 'getSites');
    } catch (searchError: unknown) {
      const errorMessage: string = extractErrorMessage(searchError);
      const errorCategory: ErrorCategory = categorizeError(searchError);
      const webUrl: string = this.context.pageContext.web.absoluteUrl;
      logWarning(
        LOG_SOURCE,
        errorMessage,
        `${ERROR_MESSAGES.SEARCH_API_FAILED}. Falling back to WebInfos API. Category: ${errorCategory}. Web URL: ${webUrl}`
      );
    }

    try {
      // Fallback to webinfos API
      const sites: ISite[] = await this.getSitesFromWebInfos();
      this.cache = sites;
      this.cacheTimestamp = now;
      return sites;
    } catch (webInfosError: unknown) {
      const errorMessage: string = extractErrorMessage(webInfosError);
      const errorCategory: ErrorCategory = categorizeError(webInfosError);
      const siteUrl: string = this.context.pageContext.site.absoluteUrl;
      const webUrl: string = this.context.pageContext.web.absoluteUrl;
      const detailedContext: string = `${ERROR_MESSAGES.BOTH_APIS_FAILED}. Search API error logged above. Category: ${errorCategory}. Site URL: ${siteUrl}, Web URL: ${webUrl}`;
      logError(LOG_SOURCE, webInfosError, detailedContext);
      
      // Throw appropriate custom error based on category
      if (errorCategory === ErrorCategory.PERMISSION) {
        throw new PermissionError(
          `Unable to fetch sites. Please check your permissions and try again. Site: ${siteUrl}`,
          webInfosError,
          'getSites - both APIs failed'
        );
      } else if (errorCategory === ErrorCategory.NETWORK) {
        throw new ApiError(
          `Unable to fetch sites. Please check your network connection and try again. Site: ${siteUrl}`,
          undefined,
          undefined,
          webInfosError,
          'getSites - both APIs failed'
        );
      } else {
        throw new ApiError(
          `${ERROR_MESSAGES.FETCH_SITES_PERMISSIONS} ${errorMessage ? `Details: ${errorMessage}` : ''}. Site: ${siteUrl}`,
          undefined,
          undefined,
          webInfosError,
          'getSites - both APIs failed'
        );
      }
    }
  }

  /**
   * Fetch sites using SharePoint Search API
   * This is the preferred method as it's faster and provides better filtering
   * @returns A promise that resolves to an array of ISite objects from search results
   * @throws {Error} If the API request fails or returns an error response
   */
  private async getSitesFromSearch(): Promise<ISite[]> {
    const webUrl = this.context.pageContext.web.absoluteUrl;
    const searchUrl = `${webUrl}${API_ENDPOINTS.SEARCH_QUERY}?querytext='${SEARCH_QUERY_PARAMS.QUERY_TEXT}'&selectproperties='${SEARCH_QUERY_PARAMS.SELECT_PROPERTIES}'&rowlimit=${SEARCH_QUERY_PARAMS.ROW_LIMIT}`;

    const response: SPHttpClientResponse = await this.context.spHttpClient.get(
      searchUrl,
      SPHttpClient.configurations.v1
    );

    if (!response.ok) {
      const errorText: string = await response.text();
      const errorMessage: string = parseApiError(errorText, ERROR_MESSAGES.FETCH_SITES_FAILED, LOG_SOURCE);
      const statusText: string = response.statusText || `HTTP ${response.status}`;
      const detailedMessage: string = `Search API request failed: ${errorMessage} (${statusText}). URL: ${searchUrl}`;
      logError(LOG_SOURCE, new Error(detailedMessage), 'getSitesFromSearch - API request failed');
      throw new Error(detailedMessage);
    }

    const data: unknown = await response.json();
    
    // Type guard for search API response structure
    if (!data || typeof data !== 'object') {
      const errorMessage: string = `Invalid search API response format. Expected object, received: ${typeof data}. URL: ${searchUrl}`;
      logError(LOG_SOURCE, new Error(errorMessage), 'getSitesFromSearch - invalid response format');
      throw new ValidationError(
        errorMessage,
        'response.data',
        data,
        undefined,
        'getSitesFromSearch'
      );
    }
    
    // Type-safe interface for SharePoint Search API response
    interface ISearchApiResponse {
      PrimaryQueryResult?: {
        RelevantResults?: {
          Table?: {
            Rows?: readonly ISiteSearchResultRow[];
          };
        };
      };
    }
    
    /**
     * Type guard function for search API response with runtime validation
     * 
     * Validates the structure of the SharePoint Search API response to ensure
     * type safety when accessing nested properties.
     * 
     * @param obj - The object to validate
     * @returns true if the object matches ISearchApiResponse structure, false otherwise
     */
    function isSearchApiResponse(obj: unknown): obj is ISearchApiResponse {
      if (!obj || typeof obj !== 'object') {
        return false;
      }
      
      // The response structure is optional at each level, so we only validate
      // that if PrimaryQueryResult exists, it has the expected structure
      const response = obj as Record<string, unknown>;
      
      // If PrimaryQueryResult exists, validate its structure
      if ('PrimaryQueryResult' in response) {
        const primaryResult = response.PrimaryQueryResult;
        if (primaryResult && typeof primaryResult === 'object') {
          const primaryResultObj = primaryResult as Record<string, unknown>;
          
          // If RelevantResults exists, validate its structure
          if ('RelevantResults' in primaryResultObj) {
            const relevantResults = primaryResultObj.RelevantResults;
            if (relevantResults && typeof relevantResults === 'object') {
              const relevantResultsObj = relevantResults as Record<string, unknown>;
              
              // If Table exists, validate its structure
              if ('Table' in relevantResultsObj) {
                const table = relevantResultsObj.Table;
                if (table && typeof table === 'object') {
                  const tableObj = table as Record<string, unknown>;
                  
                  // If Rows exists, validate it's an array
                  if ('Rows' in tableObj) {
                    return Array.isArray(tableObj.Rows);
                  }
                }
              }
            }
          }
        }
      }
      
      // Empty response or response without expected structure is still valid
      // (the API may return empty results)
      return true;
    }
    
    if (!isSearchApiResponse(data)) {
      const errorMessage: string = `Invalid search API response structure. URL: ${searchUrl}`;
      logError(LOG_SOURCE, new Error(errorMessage), 'getSitesFromSearch - invalid response structure');
      throw new ValidationError(
        errorMessage,
        'response.data',
        data,
        undefined,
        'getSitesFromSearch'
      );
    }
    
    const searchData: ISearchApiResponse = data;
    const results: readonly ISiteSearchResultRow[] = searchData?.PrimaryQueryResult?.RelevantResults?.Table?.Rows ?? [];

    // Validate and filter results before mapping
    const validResults: ISiteSearchResultRow[] = results.filter((result: ISiteSearchResultRow): boolean => {
      // Ensure result has Cells array
      return Array.isArray(result.Cells) && result.Cells.length > 0;
    });
    
    return validResults.map((result: ISiteSearchResultRow): ISite => {
      const cells: readonly ISearchResultCell[] = result.Cells ?? [];
      
      /**
       * Helper function to safely extract cell value with type validation
       * 
       * @param name - The cell key to search for
       * @returns The cell value as string, or empty string if not found
       */
      const getCellValue = (name: string): string => {
        const cell: ISearchResultCell | undefined = cells.find((c: ISearchResultCell): boolean => {
          // Validate cell structure before comparing
          return (
            typeof c === 'object' &&
            c !== null &&
            'Key' in c &&
            typeof c.Key === 'string' &&
            c.Key === name
          );
        });
        
        // Validate cell has Value property and it's a string
        if (cell && 'Value' in cell && typeof cell.Value === 'string') {
          return cell.Value;
        }
        return "";
      };

      const siteIdValue: string = getCellValue("SiteId") || getCellValue("WebId") || "";
      const webIdValue: string = getCellValue("WebId") || "";

      return {
        id: siteIdValue as SiteId,
        title: getCellValue("Title") || DEFAULT_SITE_TITLE,
        url: getCellValue("Path") || "",
        description: getCellValue("Description") || "",
        webId: webIdValue ? (webIdValue as WebId) : undefined,
        siteCollectionUrl: getCellValue("SiteCollectionUrl") || "",
      };
    }).filter((site: ISite): boolean => Boolean(site.url && site.id)); // Filter out invalid sites
  }

  /**
   * Fetch sites using SharePoint WebInfos API
   * Fallback method when search API is not available
   * @returns A promise that resolves to an array of ISite objects from web infos
   * @throws {Error} If the API request fails or returns an error response
   */
  private async getSitesFromWebInfos(): Promise<ISite[]> {
    const siteUrl = this.context.pageContext.site.absoluteUrl;
    
    // Get web infos from current site collection
    const webInfosUrl = `${siteUrl}${API_ENDPOINTS.WEB_INFOS}`;

    const response: SPHttpClientResponse = await this.context.spHttpClient.get(
      webInfosUrl,
      SPHttpClient.configurations.v1
    );

    if (!response.ok) {
      const errorText: string = await response.text();
      const errorMessage: string = parseApiError(errorText, ERROR_MESSAGES.FETCH_SITES_FAILED, LOG_SOURCE);
      const statusText: string = response.statusText || `HTTP ${response.status}`;
      const detailedMessage: string = `WebInfos API request failed: ${errorMessage} (${statusText}). URL: ${webInfosUrl}`;
      
      // Determine error type based on status code
      if (response.status === 401 || response.status === 403) {
        logError(LOG_SOURCE, new Error(detailedMessage), 'getSitesFromWebInfos - permission denied');
        throw new PermissionError(
          detailedMessage,
          new Error(errorText),
          'getSitesFromWebInfos'
        );
      } else {
        logError(LOG_SOURCE, new Error(detailedMessage), `getSitesFromWebInfos - API error (${response.status})`);
        throw new ApiError(
          detailedMessage,
          response.status,
          webInfosUrl,
          new Error(errorText),
          'getSitesFromWebInfos'
        );
      }
    }

    const data: unknown = await response.json();
    
    /**
     * Type guard for SharePoint REST API response structure
     * 
     * Validates that the response has the expected structure with a 'value' array.
     * 
     * @param obj - The object to validate
     * @returns true if the object matches ISPRestResponse structure, false otherwise
     */
    function isSPRestResponse<T>(obj: unknown): obj is ISPRestResponse<T> {
      if (!obj || typeof obj !== 'object') {
        return false;
      }
      
      const response = obj as Record<string, unknown>;
      
      // Must have 'value' property that is an array
      return 'value' in response && Array.isArray(response.value);
    }
    
    if (!isSPRestResponse<IWebInfo>(data)) {
      const errorMessage: string = `Invalid WebInfos API response structure. Expected object with 'value' array. URL: ${webInfosUrl}`;
      logError(LOG_SOURCE, new Error(errorMessage), 'getSitesFromWebInfos - invalid response structure');
      throw new ValidationError(
        errorMessage,
        'response.data',
        data,
        undefined,
        'getSitesFromWebInfos'
      );
    }
    
    const webInfosData: ISPRestResponse<IWebInfo> = data;
    
    // Validate each webInfo has required properties before mapping
    return webInfosData.value
      .filter((webInfo: IWebInfo): boolean => {
        // Validate required properties exist
        return (
          typeof webInfo.Id === 'string' &&
          webInfo.Id.length > 0 &&
          (typeof webInfo.Url === 'string' || typeof webInfo.ServerRelativeUrl === 'string')
        );
      })
      .map((webInfo: IWebInfo): ISite => ({
        id: webInfo.Id as SiteId,
        title: webInfo.Title || DEFAULT_SITE_TITLE,
        url: webInfo.Url || webInfo.ServerRelativeUrl || "",
        description: webInfo.Description || "",
        webId: webInfo.Id as WebId,
      }))
      .filter((site: ISite): boolean => Boolean(site.url && site.id));
  }

  /**
   * Clear the cached sites data
   * Forces the next getSites() call to fetch fresh data from the API
   */
  public clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Navigate to a site URL
   * @param url - The site URL to navigate to
   * @param openInNewTab - If true, opens the URL in a new tab; otherwise opens in current tab
   */
  public navigateToSite(url: string, openInNewTab?: boolean): void {
    navigateToSiteUtil(url, openInNewTab);
  }
}
