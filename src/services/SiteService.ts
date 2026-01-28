// External dependencies
import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";
import { ApplicationCustomizerContext } from "@microsoft/sp-application-base";

// Types
import { ISite, ISiteSearchResultRow, SiteId, WebId } from "../types/Site";

// Utils
import { logError, extractErrorMessage, logInfo, logWarning, isApiError } from '../utils/errorUtils';
import { ValidationError, ApiError, PermissionError } from '../utils/errors';
import { navigateToSite as navigateToSiteUtil } from '../utils/navigationUtils';
import { isValidSitesArray, createSiteId, createWebId } from '../utils/validationUtils';
import { handleSharePointApiError, withTimeout } from '../utils/errorHandlingUtils';

// Constants
import { CACHE_CONFIG, API_ENDPOINTS, SEARCH_QUERY_PARAMS, DEFAULT_SITE_TITLE, ERROR_MESSAGES } from '../utils/constants';

const LOG_SOURCE = 'SiteService';

/**
 * Service for fetching SharePoint sites using SharePoint Search API
 * 
 * This service provides methods to retrieve SharePoint sites that the current user has access to.
 * It uses the SharePoint Search API to fetch sites. Results are cached for 5 minutes to improve performance.
 * 
 * Features:
 * - 5-minute in-memory cache to reduce API calls
 * - Automatic error recovery with stale cache fallback for network errors
 * - Comprehensive validation of API responses
 * - User-friendly error messages
 * 
 * Edge cases handled:
 * - Network errors: Returns stale cache if available (better UX than error)
 * - Permission errors: Throws PermissionError (never uses stale cache)
 * - Validation errors: Throws ValidationError (never uses stale cache)
 * - Timeout errors: Returns stale cache if available
 * - Invalid API responses: Validates and filters invalid sites
 * - Empty results: Returns empty array (valid state)
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const siteService = new SiteService(context);
 * const sites = await siteService.getSites();
 * 
 * // Error handling
 * try {
 *   const sites = await siteService.getSites();
 *   // Use sites array
 * } catch (error) {
 *   if (error instanceof PermissionError) {
 *     // Handle permission error - user needs to check access
 *     showPermissionError();
 *   } else if (error instanceof ApiError) {
 *     // Handle API error - network or server issue
 *     showApiError();
 *   } else if (error instanceof ValidationError) {
 *     // Handle validation error - API returned invalid data
 *     showValidationError();
 *   }
 * }
 * 
 * // Cache management
 * siteService.clearCache(); // Force fresh data on next getSites() call
 * 
 * // Navigation
 * siteService.navigateToSite('https://contoso.sharepoint.com/sites/mysite', true);
 * // Opens site in new tab
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
   * Get all sites the current user has access to
   * Uses SharePoint Search API to fetch sites
   * Results are cached for 5 minutes to improve performance
   * 
   * Caching strategy:
   * - Results cached for 5 minutes (CACHE_CONFIG.DURATION_MS)
   * - Cache validated before returning (ensures data integrity)
   * - Cache cleared if invalid data detected
   * 
   * @returns A promise that resolves to an array of ISite objects
   * @throws ApiError, PermissionError, or ValidationError if API fails
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

    // Fetch from SharePoint Search API with error recovery
    try {
      const sites: ISite[] = await withTimeout(
        this.getSitesFromSearch(),
        undefined, // Use default timeout
        'SharePoint Search API request timed out'
      );
      
      // Validate returned sites array
      if (!isValidSitesArray(sites)) {
        throw new ValidationError(
          'SharePoint Search API returned invalid sites array',
          'sites',
          sites,
          undefined,
          'getSites'
        );
      }
      
      // Cache and return valid sites (even if empty)
      this.validateAndCacheSites(sites, now);
      return sites;
    } catch (searchError: unknown) {
      // Error recovery strategy: If it's a timeout or network error, try returning cached data
      // even if expired, as stale data is better than no data for user experience
      // Only use stale cache if we have valid cached data available
      const staleCachedSites: ISite[] | null = this.cache && isValidSitesArray(this.cache) ? this.cache : null;
      
      // Determine error category for better recovery decision
      // Permission and validation errors should not use stale cache
      const isPermissionError: boolean = searchError instanceof PermissionError;
      const isValidationError: boolean = searchError instanceof ValidationError;
      
      // Only attempt stale cache recovery for network/timeout errors, not permission/validation errors
      if (staleCachedSites && staleCachedSites.length > 0 && !isPermissionError && !isValidationError) {
        const errorMessage: string = extractErrorMessage(searchError);
        
        // Check if it's a timeout or network error using multiple indicators
        const isNetworkError: boolean = 
          isApiError(searchError) ||
          errorMessage.toLowerCase().includes('timeout') || 
          errorMessage.toLowerCase().includes('network') || 
          errorMessage.toLowerCase().includes('connection') ||
          errorMessage.toLowerCase().includes('fetch') ||
          errorMessage.toLowerCase().includes('econnrefused') ||
          errorMessage.toLowerCase().includes('enotfound');
        
        if (isNetworkError) {
          logWarning(
            LOG_SOURCE, 
            `Returning stale cached data (${staleCachedSites.length} sites) due to network error: ${errorMessage}`, 
            'getSites - error recovery with stale cache'
          );
          // Return stale cache as fallback for network errors
          // This provides better UX than showing an error when network is temporarily unavailable
          return staleCachedSites;
        }
      }
      
      // Search API failed - throw appropriate error type with user-friendly message
      const searchUrl: string = `${this.context.pageContext.web.absoluteUrl}${API_ENDPOINTS.SEARCH_POSTQUERY}`;
      handleSharePointApiError(searchError, this.context, LOG_SOURCE, searchUrl, ERROR_MESSAGES.FETCH_SITES_FAILED);
    }
  }

  /**
   * Handles API response errors and throws appropriate error types
   * 
   * Centralizes error handling for SharePoint Search API responses by categorizing
   * errors and throwing appropriate error types (PermissionError for 401/403,
   * ApiError for other HTTP errors).
   * 
   * @param response - The HTTP response object with status and error information
   * @param searchUrl - The API URL that was called (for logging context)
   * @param errorText - The error text extracted from the response body
   * @throws PermissionError - If response status is 401 or 403 (authentication/authorization failure)
   * @throws ApiError - For all other HTTP error status codes (network, server errors, etc.)
   * 
   * @example
   * ```typescript
   * if (!response.ok) {
   *   const errorText = await response.text();
   *   this.handleSearchApiResponseError(response, searchUrl, errorText);
   * }
   * ```
   */
  private handleSearchApiResponseError(response: SPHttpClientResponse, searchUrl: string, errorText: string): never {
    const errorMessage: string = extractErrorMessage(new Error(errorText));
    
    // Check if it's a permission error (401, 403)
    if (response.status === 401 || response.status === 403) {
      logError(LOG_SOURCE, new Error(errorText), `SharePoint Search API permission error (${response.status}). URL: ${searchUrl}`);
      throw new PermissionError(
        ERROR_MESSAGES.FETCH_SITES_PERMISSIONS,
        new Error(errorText),
        'getSitesFromSearch - permission denied'
      );
    }
    
    // Other API errors - use standardized error message with additional context
    logError(LOG_SOURCE, new Error(errorText), `SharePoint Search API request failed (${response.status}). URL: ${searchUrl}`);
    throw new ApiError(
      `${ERROR_MESSAGES.FETCH_SITES_FAILED}: ${errorMessage}`,
      response.status,
      searchUrl,
      new Error(errorText),
      'getSitesFromSearch - API error'
    );
  }

  /**
   * Filters search result rows to only include valid rows with required structure
   * 
   * @param rows - Raw search result rows from SharePoint Search API
   * @returns Array of valid search result rows
   */
  private filterValidSearchResults(rows: readonly ISiteSearchResultRow[]): ISiteSearchResultRow[] {
    return rows.filter((row: ISiteSearchResultRow): boolean => {
      return this.isValidSearchResult(row);
    });
  }

  /**
   * Maps search result rows to ISite objects
   * 
   * @param validRows - Validated search result rows
   * @returns Array of ISite objects
   */
  private mapSearchResultsToSites(validRows: readonly ISiteSearchResultRow[]): ISite[] {
    return validRows.map((row: ISiteSearchResultRow): ISite => this.mapSearchResultToSite(row));
  }

  /**
   * Filters sites to only include those with valid URL and ID
   * 
   * @param sites - Sites to validate
   * @returns Array of fully valid sites
   */
  private filterValidSites(sites: readonly ISite[]): ISite[] {
    return sites.filter((site: ISite): boolean => {
      const isValid: boolean = Boolean(site.url && site.id);
      if (!isValid) {
        logWarning(LOG_SOURCE, `Site filtered out at final validation stage`, `ID: ${site.id || 'missing'}, URL: ${site.url || 'missing'}, Title: ${site.title || 'missing'}`);
      }
      return isValid;
    });
  }

  /**
   * Logs processing summary statistics for debugging and monitoring
   * 
   * @param rawCount - Original count of rows from API
   * @param finalCount - Final count of valid sites after processing
   */
  private logProcessingSummary(rawCount: number, finalCount: number): void {
    // Alert if all sites were filtered (indicates potential API or validation issue)
    if (finalCount === 0 && rawCount > 0) {
      const warningDetails: string = `All ${rawCount} sites from API were filtered out. Check validation logic.`;
      logError(LOG_SOURCE, new Error(warningDetails), 'getSitesFromSearch - all sites filtered out');
    } else if (finalCount < rawCount) {
      // Log when some sites were filtered (normal if API returns invalid data)
      const filteredCount: number = rawCount - finalCount;
      logWarning(LOG_SOURCE, `${filteredCount} sites were filtered out during processing`, `from ${rawCount} total to ${finalCount} valid`);
    }
  }

  /**
   * Processes and validates search results through multiple stages
   * 
   * Implements a three-stage validation and transformation pipeline:
   * 1. Filters rows by isValidSearchResult (validates required properties exist)
   * 2. Maps valid rows to ISite format using mapSearchResultToSite
   * 3. Final validation filter for sites with valid URL and ID
   * 
   * Logs progress at each stage and provides summary statistics for debugging.
   * 
   * @param rows - Raw search result rows from SharePoint Search API
   * @returns Validated and mapped sites array, ready for use in the application
   * 
   * @example
   * ```typescript
   * const rows = data.PrimaryQueryResult?.RelevantResults?.Table?.Rows || [];
   * const sites = this.processSearchResults(rows);
   * // Returns: ISite[] with validated sites
   * ```
   */
  private processSearchResults(rows: readonly ISiteSearchResultRow[]): ISite[] {
    const rawSiteCount: number = rows.length;
    
    // Stage 1: Filter by isValidSearchResult
    // This stage validates that each row has the required structure (Cells array with Path and Title)
    // We filter early to avoid processing invalid rows in subsequent stages
    const validSearchResults: ISiteSearchResultRow[] = this.filterValidSearchResults(rows);
    logInfo(LOG_SOURCE, `${validSearchResults.length} sites passed isValidSearchResult validation`, `out of ${rawSiteCount} total`);
    
    // Stage 2: Map to ISite format
    // Transform valid search result rows into ISite objects by extracting values from Cells array
    // Each row's Cells array contains key-value pairs (e.g., {Key: 'Path', Value: 'https://...'})
    const mappedSites: ISite[] = this.mapSearchResultsToSites(validSearchResults);
    logInfo(LOG_SOURCE, `${mappedSites.length} sites mapped to ISite format`, '');
    
    // Stage 3: Final filter for sites with valid url and id
    // Even after mapping, we need to ensure the resulting ISite objects have required properties
    // This catches cases where mapping might have produced incomplete objects (e.g., empty URLs)
    const finalSites: ISite[] = this.filterValidSites(mappedSites);
    logInfo(LOG_SOURCE, `${finalSites.length} sites passed final validation`, `out of ${mappedSites.length} mapped sites`);
    
    // Log summary for debugging and monitoring
    this.logProcessingSummary(rawSiteCount, finalSites.length);
    
    return finalSites;
  }

  /**
   * Fetch sites using SharePoint Search API
   * 
   * Uses the SharePoint Search API /_api/search/query endpoint to retrieve all sites the current user has access to.
   * Search API returns results in a table format with cells containing key-value pairs.
   * 
   * @returns A promise that resolves to an array of ISite objects from Search API
   * @throws {ApiError} If the API request fails (network error, invalid response, etc.)
   * @throws {PermissionError} If the user lacks permissions (401, 403 status codes)
   * @throws {ValidationError} If the API response has an invalid structure
   */
  private async getSitesFromSearch(): Promise<ISite[]> {
    // Get SPHttpClient instance - automatically handles authentication using SPFx context
    const client: SPHttpClient = this.context.spHttpClient;
    
    // Build Search API URL
    const searchUrl: string = `${this.context.pageContext.web.absoluteUrl}${API_ENDPOINTS.SEARCH_POSTQUERY}`;
    
    // Build Search API request body - wrapped in 'request' object
    const requestBody = {
      request: {
        Querytext: SEARCH_QUERY_PARAMS.QUERY_TEXT,
        SelectProperties: SEARCH_QUERY_PARAMS.SELECT_PROPERTIES,
        RowLimit: SEARCH_QUERY_PARAMS.ROW_LIMIT,
        TrimDuplicates: SEARCH_QUERY_PARAMS.TRIM_DUPLICATES,
      },
    };

    let response: SPHttpClientResponse;
    let data: unknown;
    try {
      // Use SPHttpClient to make POST request to Search API
      response = await client.post(
        searchUrl,
        SPHttpClient.configurations.v1,
        {
          headers: {
            'Accept': 'application/json;odata.metadata=none',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );
      
      if (!response.ok) {
        const errorText: string = await response.text();
        this.handleSearchApiResponseError(response, searchUrl, errorText);
      }
      
      const responseData = await response.json();
      
      // OData metadata=none format returns direct response (no 'd' wrapper)
      // Fallback to 'd' property for compatibility with verbose format if needed
      data = (responseData as { d?: unknown }).d || responseData;
    } catch (apiError: unknown) {
      // Handle errors that occurred before response parsing
      if (apiError instanceof PermissionError || apiError instanceof ApiError) {
        throw apiError;
      }
      
      const errorMessage: string = extractErrorMessage(apiError);
      const errorType: string = apiError instanceof Error ? apiError.constructor.name : typeof apiError;
      const errorDetails: string = `SharePoint Search API call failed. URL: ${searchUrl}. Error type: ${errorType}. Error: ${errorMessage}`;
      
      // Check if it's a permission error (401, 403)
      if (apiError instanceof Error && (
        errorMessage.includes('401') || 
        errorMessage.includes('403') ||
        errorMessage.includes('Unauthorized') ||
        errorMessage.includes('Forbidden')
      )) {
        logError(LOG_SOURCE, apiError, `SharePoint Search API permission error (401/403). URL: ${searchUrl}`);
        throw new PermissionError(
          ERROR_MESSAGES.FETCH_SITES_PERMISSIONS,
          apiError,
          'getSitesFromSearch - permission denied'
        );
      }
      
      // Check if it's a network/API error - use standardized error message
      logError(LOG_SOURCE, apiError, errorDetails);
      throw new ApiError(
        `${ERROR_MESSAGES.FETCH_SITES_FAILED}: ${errorMessage}`,
        undefined,
        searchUrl,
        apiError instanceof Error ? apiError : new Error(String(apiError)),
        'getSitesFromSearch - API error'
      );
    }
    
    /**
     * Type guard for SharePoint Search API response structure
     * 
     * Validates that the response has the expected structure with PrimaryQueryResult.RelevantResults.Table.Rows.
     * Handles both OData verbose format (wrapped in 'd') and direct format.
     * 
     * @param obj - The object to validate
     * @returns true if the object matches Search API response structure, false otherwise
     */
    function isSearchApiResponse(obj: unknown): obj is {
      PrimaryQueryResult?: {
        RelevantResults?: {
          Table?: {
            Rows?: readonly ISiteSearchResultRow[];
          };
        };
      };
    } {
      if (!obj || typeof obj !== 'object') {
        return false;
      }
      
      const response = obj as Record<string, unknown>;
      
      // Check for PrimaryQueryResult structure
      if (!('PrimaryQueryResult' in response) || typeof response.PrimaryQueryResult !== 'object' || response.PrimaryQueryResult === null) {
        return false;
      }
      
      const primaryResult = response.PrimaryQueryResult as Record<string, unknown>;
      if (!('RelevantResults' in primaryResult) || typeof primaryResult.RelevantResults !== 'object' || primaryResult.RelevantResults === null) {
        return false;
      }
      
      const relevantResults = primaryResult.RelevantResults as Record<string, unknown>;
      if (!('Table' in relevantResults) || typeof relevantResults.Table !== 'object' || relevantResults.Table === null) {
        return false;
      }
      
      const table = relevantResults.Table as Record<string, unknown>;
      return 'Rows' in table && Array.isArray(table.Rows);
    }
    
    if (!isSearchApiResponse(data)) {
      const errorMessage: string = `Invalid SharePoint Search API response structure. Expected PrimaryQueryResult.RelevantResults.Table.Rows. URL: ${searchUrl}`;
      const context: string = `getSitesFromSearch - invalid response structure. Data type: ${typeof data}, isObject: ${typeof data === 'object'}, isNull: ${data === null}`;
      
      logError(LOG_SOURCE, new Error(errorMessage), context);
      throw new ValidationError(
        errorMessage,
        'response.data',
        data,
        undefined,
        context
      );
    }
    
    // Extract rows from Search API response
    const rows: readonly ISiteSearchResultRow[] = data.PrimaryQueryResult?.RelevantResults?.Table?.Rows || [];
    logInfo(LOG_SOURCE, `SharePoint Search API returned ${rows.length} sites`, `URL: ${searchUrl}`);
    
    // Process and validate search results
    return this.processSearchResults(rows);
  }

  /**
   * Validates if a Search API result row has required properties
   * 
   * Helper method to validate Search API result rows before mapping.
   * 
   * @param row - The Search API result row to validate
   * @returns true if the row is valid, false otherwise
   */
  private isValidSearchResult(row: ISiteSearchResultRow): boolean {
    // Validate that row has Cells array
    if (!row.Cells || !Array.isArray(row.Cells) || row.Cells.length === 0) {
      return false;
    }
    
    // Check for required properties: Path (URL) and Title
    const hasPath: boolean = row.Cells.some((cell) => cell.Key === 'Path' && typeof cell.Value === 'string' && cell.Value.length > 0);
    const hasTitle: boolean = row.Cells.some((cell) => cell.Key === 'Title' && typeof cell.Value === 'string');
    
    return hasPath && hasTitle;
  }

  /**
   * Maps a Search API result row to an ISite object
   * 
   * Extracts site information from a SharePoint Search API response row.
   * This is a helper method to keep getSitesFromSearch focused.
   * 
   * @param row - The Search API result row to map
   * @returns An ISite object with extracted data
   */
  private mapSearchResultToSite(row: ISiteSearchResultRow): ISite {
    // Helper function to get cell value by key
    const getCellValue = (key: string): string => {
      const cell = row.Cells.find((c) => c.Key === key);
      return cell?.Value || '';
    };
    
    // Extract values from cells
    const path: string = getCellValue('Path');
    const title: string = getCellValue('Title') || DEFAULT_SITE_TITLE;
    const description: string = getCellValue('Description');
    const siteId: string = getCellValue('SiteId');
    const webId: string = getCellValue('WebId');
    const siteCollectionUrl: string = getCellValue('SiteCollectionUrl');
    
    // Validate and create branded types safely using helper functions
    const validatedSiteId: SiteId = createSiteId(siteId);
    const validatedWebId: WebId | undefined = createWebId(webId);
    
    return {
      id: validatedSiteId,
      title,
      url: path,
      description: description || undefined,
      webId: validatedWebId,
      siteCollectionUrl: siteCollectionUrl || undefined,
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
