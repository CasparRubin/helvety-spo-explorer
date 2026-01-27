import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";
import { ApplicationCustomizerContext } from "@microsoft/sp-application-base";
import { ISite, ISiteSearchResultRow, ISearchResultCell, ISPRestResponse, IWebInfo, SiteId, WebId } from "../types/Site";
import { logError, logWarning } from '../utils/errorUtils';
import { ValidationError } from '../utils/errors';
import { CACHE_CONFIG, API_ENDPOINTS, SEARCH_QUERY_PARAMS, DEFAULT_SITE_TITLE, ERROR_MESSAGES } from '../utils/constants';
import { navigateToSite as navigateToSiteUtil } from '../utils/navigationUtils';
import { isValidSitesArray, isValidSiteIdCandidate, isValidWebIdCandidate } from '../utils/validationUtils';
import { handleSearchApiError, handleWebInfosApiError, handleApiResponseError, withTimeout } from '../utils/errorHandlingUtils';

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
   * Validates and caches sites array
   * 
   * Validates the sites array and updates the cache if valid.
   * 
   * @param sites - Sites array to validate and cache
   * @param timestamp - Cache timestamp
   * @returns true if sites were cached, false if validation failed
   */
  private validateAndCacheSites(sites: ISite[], timestamp: number): boolean {
    if (!isValidSitesArray(sites)) {
      return false;
    }
    
    this.cache = sites;
    this.cacheTimestamp = timestamp;
    return true;
  }

  /**
   * Checks if cached sites are still valid
   * 
   * @param now - Current timestamp
   * @returns Cached sites if valid, null otherwise
   */
  private getValidCachedSites(now: number): ISite[] | null {
    if (this.cache && (now - this.cacheTimestamp) < CACHE_CONFIG.DURATION_MS) {
      if (isValidSitesArray(this.cache)) {
        return this.cache;
      }
      // If cache is invalid, clear it
      this.clearCache();
    }
    return null;
  }

  /**
   * Attempts to fetch sites from Search API with fallback handling
   * 
   * Tries the Search API first, and if it fails or returns invalid/empty results,
   * logs a warning and returns null to allow fallback to WebInfos API.
   * 
   * @param now - Current timestamp for caching
   * @returns Sites array if successful, null if should fallback
   */
  private async tryFetchFromSearchApi(now: number): Promise<ISite[] | null> {
    try {
      const sites: ISite[] = await withTimeout(
        this.getSitesFromSearch(),
        undefined, // Use default timeout
        'Search API request timed out'
      );
      
      // Validate and cache if valid and non-empty
      if (sites.length > 0 && this.validateAndCacheSites(sites, now)) {
        return sites;
      }
      
      // Invalid or empty results - log warning and fall through to webinfos API
      const webUrl: string = this.context.pageContext.web.absoluteUrl;
      if (!isValidSitesArray(sites)) {
        logWarning(
          LOG_SOURCE, 
          'Search API returned invalid sites array', 
          `getSites - invalid response format. Web URL: ${webUrl}`
        );
      } else {
        logWarning(
          LOG_SOURCE, 
          'Search API returned no results, falling back to WebInfos API', 
          `getSites - empty results. Web URL: ${webUrl}`
        );
      }
      
      return null;
    } catch (searchError: unknown) {
      // Search API failed - log error and continue to fallback API
      handleSearchApiError(searchError, this.context, LOG_SOURCE);
      return null;
    }
  }

  /**
   * Fetches sites from WebInfos API with validation
   * 
   * This is the fallback method when Search API fails or returns invalid results.
   * 
   * @param now - Current timestamp for caching
   * @returns Sites array
   * @throws ValidationError, ApiError, or PermissionError if API fails
   */
  private async fetchFromWebInfosApi(now: number): Promise<ISite[]> {
    const sites: ISite[] = await withTimeout(
      this.getSitesFromWebInfos(),
      undefined, // Use default timeout
      'WebInfos API request timed out'
    );
    
    // Validate returned sites array
    if (!isValidSitesArray(sites)) {
      throw new ValidationError(
        'WebInfos API returned invalid sites array',
        'sites',
        sites,
        undefined,
        'getSites'
      );
    }
    
    // Cache and return valid sites (even if empty)
    this.validateAndCacheSites(sites, now);
    return sites;
  }

  /**
   * Get all sites the current user has access to
   * Uses SharePoint Search API as primary method, falls back to webinfos if needed
   * Results are cached for 5 minutes to improve performance
   * 
   * Error handling strategy:
   * 1. Try Search API first (better for large tenants, faster, better filtering)
   * 2. If Search API fails or returns empty/invalid results, fall back to WebInfos API
   * 3. If both APIs fail, throw standardized error based on error category
   * 
   * Caching strategy:
   * - Results cached for 5 minutes (CACHE_CONFIG.DURATION_MS)
   * - Cache validated before returning (ensures data integrity)
   * - Cache cleared if invalid data detected
   * 
   * @returns A promise that resolves to an array of ISite objects
   * @throws ApiError, PermissionError, or ValidationError if both API methods fail
   * 
   * @example
   * ```typescript
   * const siteService = new SiteService(context);
   * try {
   *   const sites = await siteService.getSites();
   *   // Use sites array
   * } catch (error) {
   *   if (error instanceof PermissionError) {
   *     // Handle permission error
   *   } else if (error instanceof ApiError) {
   *     // Handle API error
   *   }
   * }
   * ```
   */
  public async getSites(): Promise<ISite[]> {
    // Check cache first (fast path - avoids API calls)
    const now: number = Date.now();
    const cachedSites: ISite[] | null = this.getValidCachedSites(now);
    if (cachedSites) {
      return cachedSites;
    }

    // Try Search API first (better for large tenants)
    const searchResults: ISite[] | null = await this.tryFetchFromSearchApi(now);
    if (searchResults) {
      return searchResults;
    }

    // Fallback to WebInfos API (slower but more reliable)
    try {
      return await this.fetchFromWebInfosApi(now);
    } catch (webInfosError: unknown) {
      // Both APIs failed - throw appropriate error type
      handleWebInfosApiError(webInfosError, this.context, LOG_SOURCE, ERROR_MESSAGES);
    }
  }

  /**
   * Fetch sites using SharePoint Search API
   * This is the preferred method as it's faster and provides better filtering
   * @returns A promise that resolves to an array of ISite objects from search results
   * @throws {ApiError} If the API request fails (network error, invalid response, etc.)
   * @throws {ValidationError} If the API response has an invalid structure
   */
  private async getSitesFromSearch(): Promise<ISite[]> {
    const webUrl = this.context.pageContext.web.absoluteUrl;
    const searchUrl = `${webUrl}${API_ENDPOINTS.SEARCH_QUERY}?querytext='${SEARCH_QUERY_PARAMS.QUERY_TEXT}'&selectproperties='${SEARCH_QUERY_PARAMS.SELECT_PROPERTIES}'&rowlimit=${SEARCH_QUERY_PARAMS.ROW_LIMIT}`;

    const response: SPHttpClientResponse = await this.context.spHttpClient.get(
      searchUrl,
      SPHttpClient.configurations.v1
    );

    if (!response.ok) {
      await handleApiResponseError(response, {
        logSource: LOG_SOURCE,
        apiUrl: searchUrl,
        defaultErrorMessage: ERROR_MESSAGES.FETCH_SITES_FAILED,
        operationContext: 'getSitesFromSearch'
      });
    }

    const data: unknown = await response.json();
    
    // Validate response structure
    if (!data || typeof data !== 'object') {
      const errorMessage: string = `Invalid search API response format. Expected object, received: ${typeof data}. URL: ${searchUrl}`;
      const context: string = 'getSitesFromSearch - invalid response format';
      
      logError(LOG_SOURCE, new Error(errorMessage), context);
      throw new ValidationError(
        errorMessage,
        'response.data',
        data,
        undefined,
        context
      );
    }
    
    // Safely access nested properties with optional chaining
    const responseData = data as Record<string, unknown>;
    const primaryResult = responseData.PrimaryQueryResult as Record<string, unknown> | undefined;
    const relevantResults = primaryResult?.RelevantResults as Record<string, unknown> | undefined;
    const table = relevantResults?.Table as Record<string, unknown> | undefined;
    const rows = table?.Rows;
    
    // Validate Rows is an array if it exists
    if (rows !== undefined && !Array.isArray(rows)) {
      const errorMessage: string = `Invalid search API response structure. Expected Rows to be an array. URL: ${searchUrl}`;
      const context: string = 'getSitesFromSearch - invalid response structure';
      
      logError(LOG_SOURCE, new Error(errorMessage), context);
      throw new ValidationError(
        errorMessage,
        'response.data.PrimaryQueryResult.RelevantResults.Table.Rows',
        rows,
        undefined,
        context
      );
    }
    
    const results: readonly ISiteSearchResultRow[] = (rows as readonly ISiteSearchResultRow[] | undefined) ?? [];

    // Validate and filter results before mapping
    const validResults: ISiteSearchResultRow[] = results.filter((result: ISiteSearchResultRow): boolean => {
      // Ensure result has Cells array
      return Array.isArray(result.Cells) && result.Cells.length > 0;
    });
    
    return validResults.map((result: ISiteSearchResultRow): ISite => {
      return this.mapSearchResultToSite(result);
    }).filter((site: ISite): boolean => Boolean(site.url && site.id)); // Filter out invalid sites
  }

  /**
   * Fetch sites using SharePoint WebInfos API
   * Fallback method when search API is not available
   * @returns A promise that resolves to an array of ISite objects from web infos
   * @throws {ApiError} If the API request fails (network error, invalid response, etc.)
   * @throws {PermissionError} If the user lacks permissions (401, 403 status codes)
   * @throws {ValidationError} If the API response has an invalid structure
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
      await handleApiResponseError(response, {
        logSource: LOG_SOURCE,
        apiUrl: webInfosUrl,
        defaultErrorMessage: ERROR_MESSAGES.FETCH_SITES_FAILED,
        operationContext: 'getSitesFromWebInfos'
      });
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
      // Standardized error handling pattern
      const errorMessage: string = `Invalid WebInfos API response structure. Expected object with 'value' array. URL: ${webInfosUrl}`;
      const context: string = 'getSitesFromWebInfos - invalid response structure';
      
      logError(LOG_SOURCE, new Error(errorMessage), context);
      throw new ValidationError(
        errorMessage,
        'response.data',
        data,
        undefined,
        context
      );
    }
    
    const webInfosData: ISPRestResponse<IWebInfo> = data;
    
    // Validate each webInfo has required properties before mapping
    return webInfosData.value
      .filter((webInfo: IWebInfo): boolean => this.isValidWebInfo(webInfo))
      .map((webInfo: IWebInfo): ISite => this.mapWebInfoToSite(webInfo))
      .filter((site: ISite): boolean => Boolean(site.url && site.id));
  }

  /**
   * Maps a search result row to an ISite object
   * 
   * Extracts site information from a SharePoint Search API result row.
   * This is a helper method to keep getSitesFromSearch focused.
   * 
   * @param result - The search result row to map
   * @returns An ISite object with extracted data
   */
  private mapSearchResultToSite(result: ISiteSearchResultRow): ISite {
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

    // Validate and create branded types safely
    // Only create SiteId if we have a valid non-empty string
    const siteId: SiteId = isValidSiteIdCandidate(siteIdValue) ? (siteIdValue as SiteId) : ("" as SiteId);
    const webId: WebId | undefined = isValidWebIdCandidate(webIdValue) ? (webIdValue as WebId) : undefined;

    return {
      id: siteId,
      title: getCellValue("Title") || DEFAULT_SITE_TITLE,
      url: getCellValue("Path") || "",
      description: getCellValue("Description") || "",
      webId,
      siteCollectionUrl: getCellValue("SiteCollectionUrl") || "",
    };
  }

  /**
   * Validates if a webInfo object has required properties
   * 
   * Helper method to validate webInfo objects before mapping.
   * 
   * @param webInfo - The webInfo object to validate
   * @returns true if the webInfo is valid, false otherwise
   */
  private isValidWebInfo(webInfo: IWebInfo): boolean {
    // Validate required properties exist
    return (
      typeof webInfo.Id === 'string' &&
      webInfo.Id.length > 0 &&
      (typeof webInfo.Url === 'string' || typeof webInfo.ServerRelativeUrl === 'string')
    );
  }

  /**
   * Maps a webInfo object to an ISite object
   * 
   * Extracts site information from a SharePoint WebInfos API response.
   * This is a helper method to keep getSitesFromWebInfos focused.
   * 
   * @param webInfo - The webInfo object to map
   * @returns An ISite object with extracted data
   */
  private mapWebInfoToSite(webInfo: IWebInfo): ISite {
    // Validate and create branded types safely
    const siteId: SiteId = isValidSiteIdCandidate(webInfo.Id) ? (webInfo.Id as SiteId) : ("" as SiteId);
    const webId: WebId = isValidWebIdCandidate(webInfo.Id) ? (webInfo.Id as WebId) : ("" as WebId);
    
    return {
      id: siteId,
      title: webInfo.Title || DEFAULT_SITE_TITLE,
      url: webInfo.Url || webInfo.ServerRelativeUrl || "",
      description: webInfo.Description || "",
      webId,
    };
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
