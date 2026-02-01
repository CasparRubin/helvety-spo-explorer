/**
 * License Service for validating tenant subscriptions
 *
 * This service handles license validation against the Helvety Store API.
 * It extracts the tenant ID from the SharePoint context and validates
 * the license status, caching results to minimize API calls.
 *
 * Features:
 * - 1-hour cache for license status to reduce API load
 * - Grace period support for expired subscriptions
 * - Offline fallback using cached data
 * - Automatic tenant ID extraction from SharePoint URL
 *
 * @example
 * ```typescript
 * const licenseService = new LicenseService(context);
 * const status = await licenseService.validateLicense();
 *
 * if (status.valid) {
 *   // License is valid, enable full functionality
 *   console.log('Licensed until:', status.expiresAt);
 * } else {
 *   // Show license prompt or disable features
 *   console.log('License invalid:', status.reason);
 * }
 * ```
 */

// External dependencies
import { HttpClient, HttpClientResponse } from "@microsoft/sp-http";
import { ApplicationCustomizerContext } from "@microsoft/sp-application-base";

// Types
import {
  ILicenseValidationResponse,
  ICachedLicenseStatus,
  ILicenseStatus,
} from "../types/License";

// Utils
import { logError, logInfo, logWarning } from "../utils/errorUtils";

// Constants
import { LICENSE_API, LICENSE_CACHE } from "../utils/constants";

const LOG_SOURCE = "LicenseService";

/**
 * Service for validating tenant licenses against Helvety Store API
 */
export class LicenseService {
  private context: ApplicationCustomizerContext;
  private tenantId: string | undefined = undefined;

  /**
   * Creates a new instance of LicenseService
   * @param context - The SharePoint application customizer context
   */
  constructor(context: ApplicationCustomizerContext) {
    this.context = context;
    this.tenantId = this.extractTenantId();
  }

  /**
   * Extracts the tenant ID from the SharePoint URL
   *
   * @returns The tenant identifier (e.g., "contoso" from contoso.sharepoint.com)
   */
  private extractTenantId(): string | undefined {
    try {
      const webUrl = this.context.pageContext.web.absoluteUrl;
      const url = new URL(webUrl);
      const hostname = url.hostname;

      // Extract tenant from hostname (e.g., "contoso" from "contoso.sharepoint.com")
      const match = hostname.match(/^([^.]+)\.sharepoint\.com$/i);
      if (match && match[1]) {
        return match[1].toLowerCase();
      }

      // Handle SharePoint multi-geo or custom domains
      // Try to extract from the first subdomain
      const parts = hostname.split(".");
      if (parts.length >= 3 && parts[parts.length - 2] === "sharepoint") {
        return parts[0].toLowerCase();
      }

      logWarning(
        LOG_SOURCE,
        `Could not extract tenant ID from hostname: ${hostname}`,
        "extractTenantId"
      );
      return undefined;
    } catch (error) {
      logError(
        LOG_SOURCE,
        error instanceof Error ? error : new Error(String(error)),
        "extractTenantId - failed to extract tenant ID"
      );
      return undefined;
    }
  }

  /**
   * Gets the cached license status from localStorage
   *
   * @returns The cached license status or undefined if not found/expired
   */
  private getCachedLicense(): ICachedLicenseStatus | undefined {
    try {
      const cacheKey = this.getCacheKey();
      const cached = localStorage.getItem(cacheKey);

      if (!cached) {
        return undefined;
      }

      const parsed: ICachedLicenseStatus = JSON.parse(cached);

      // Validate cache structure
      if (!parsed.response || !parsed.cachedAt || !parsed.tenantId) {
        logWarning(LOG_SOURCE, "Invalid cache structure", "getCachedLicense");
        localStorage.removeItem(cacheKey);
        return undefined;
      }

      // Check if cache is for the correct tenant
      if (parsed.tenantId !== this.tenantId) {
        logWarning(
          LOG_SOURCE,
          `Cache tenant mismatch: ${parsed.tenantId} !== ${this.tenantId}`,
          "getCachedLicense"
        );
        localStorage.removeItem(cacheKey);
        return undefined;
      }

      return parsed;
    } catch (error) {
      logWarning(
        LOG_SOURCE,
        `Failed to parse cached license: ${error}`,
        "getCachedLicense"
      );
      return undefined;
    }
  }

  /**
   * Checks if the cached license is still valid (not expired)
   * Uses different cache durations for valid vs invalid licenses:
   * - Valid licenses: 24 hours (enterprise friendly)
   * - Invalid licenses: 1 hour (allows re-check after purchase)
   *
   * @param cached - The cached license status
   * @returns true if cache is still valid, false otherwise
   */
  private isCacheValid(cached: ICachedLicenseStatus): boolean {
    const now = Date.now();
    const cacheAge = now - cached.cachedAt;

    // Use longer cache for valid licenses (enterprise friendly)
    const cacheDuration = cached.response.valid
      ? LICENSE_CACHE.VALID_DURATION_MS
      : LICENSE_CACHE.INVALID_DURATION_MS;

    return cacheAge < cacheDuration;
  }

  /**
   * Checks if the cached license is within the grace period
   * Used for offline fallback when cache is expired
   *
   * @param cached - The cached license status
   * @returns true if within grace period, false otherwise
   */
  private isCacheInGracePeriod(cached: ICachedLicenseStatus): boolean {
    const now = Date.now();
    const cacheAge = now - cached.cachedAt;
    return cacheAge < LICENSE_CACHE.GRACE_PERIOD_MS;
  }

  /**
   * Saves license status to localStorage cache
   *
   * @param response - The license validation response to cache
   */
  private cacheLicense(response: ILicenseValidationResponse): void {
    try {
      const cacheData: ICachedLicenseStatus = {
        response,
        cachedAt: Date.now(),
        tenantId: this.tenantId || "",
      };

      localStorage.setItem(this.getCacheKey(), JSON.stringify(cacheData));
      logInfo(
        LOG_SOURCE,
        "License cached successfully",
        `Valid: ${response.valid}`
      );
    } catch (error) {
      logWarning(
        LOG_SOURCE,
        `Failed to cache license: ${error}`,
        "cacheLicense"
      );
    }
  }

  /**
   * Gets the localStorage key for caching license status
   */
  private getCacheKey(): string {
    return `${LICENSE_CACHE.KEY}-${this.tenantId || "unknown"}`;
  }

  /**
   * Validates the license for the current tenant
   *
   * @returns The license validation response
   */
  public async validateLicense(): Promise<ILicenseValidationResponse> {
    // Check if tenant ID could be extracted
    if (!this.tenantId) {
      logWarning(LOG_SOURCE, "No tenant ID available", "validateLicense");
      return {
        valid: false,
        reason: "invalid_tenant_id",
      };
    }

    // Check cache first
    const cached = this.getCachedLicense();
    if (cached && this.isCacheValid(cached)) {
      logInfo(
        LOG_SOURCE,
        "Returning cached license status",
        `Valid: ${cached.response.valid}, Age: ${Date.now() - cached.cachedAt}ms`
      );
      return cached.response;
    }

    // Fetch fresh license status
    try {
      const response = await this.fetchLicenseStatus();
      this.cacheLicense(response);
      return response;
    } catch (error) {
      // Network error - try to use cached data even if expired (within grace period)
      if (cached && this.isCacheInGracePeriod(cached)) {
        logWarning(
          LOG_SOURCE,
          `Network error, using stale cache (age: ${Date.now() - cached.cachedAt}ms): ${error}`,
          "validateLicense - fallback to stale cache"
        );
        return cached.response;
      }

      // No cached data or outside grace period
      logError(
        LOG_SOURCE,
        error instanceof Error ? error : new Error(String(error)),
        "validateLicense - failed to fetch license"
      );

      return {
        valid: false,
        reason: "server_error",
      };
    }
  }

  /**
   * Fetches license status from the Helvety Store API
   *
   * @returns The license validation response from the API
   * @throws Error if the API request fails
   */
  private async fetchLicenseStatus(): Promise<ILicenseValidationResponse> {
    const client: HttpClient = this.context.httpClient;
    const url = `${LICENSE_API.BASE_URL}${LICENSE_API.VALIDATE_ENDPOINT}?tenant=${encodeURIComponent(
      this.tenantId || ""
    )}&product=${LICENSE_API.PRODUCT_ID}`;

    logInfo(
      LOG_SOURCE,
      `Fetching license status for tenant: ${this.tenantId}, product: ${LICENSE_API.PRODUCT_ID}`,
      url
    );

    const response: HttpClientResponse = await client.get(
      url,
      HttpClient.configurations.v1,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `License API request failed (${response.status}): ${errorText}`
      );
    }

    const data: ILicenseValidationResponse = await response.json();
    logInfo(
      LOG_SOURCE,
      `License validation result: ${data.valid ? "VALID" : "INVALID"}`,
      data.reason || data.tier || ""
    );

    return data;
  }

  /**
   * Gets cached license status immediately without making API calls.
   * Returns undefined if no valid cache exists.
   *
   * This is useful for non-blocking initialization - get cached status first,
   * then validate in background.
   *
   * @returns The cached license status or undefined if no valid cache
   */
  public getQuickCacheStatus(): ILicenseStatus | undefined {
    const cached = this.getCachedLicense();

    if (!cached) {
      return undefined;
    }

    // For quick cache, we're more lenient - use grace period for valid licenses
    // This ensures enterprise customers are never blocked
    const isUsable = cached.response.valid
      ? this.isCacheInGracePeriod(cached) // Valid licenses: use within 7 days
      : this.isCacheValid(cached); // Invalid licenses: use within 1 hour

    if (!isUsable) {
      return undefined;
    }

    return {
      isValid: cached.response.valid,
      isValidating: false,
      isChecked: true,
      tier: cached.response.tier,
      features: cached.response.features || [],
      expiresAt: cached.response.expiresAt
        ? new Date(cached.response.expiresAt)
        : undefined,
      error: cached.response.valid
        ? undefined
        : this.getErrorMessage(cached.response.reason),
      isCached: true,
    };
  }

  /**
   * Gets a simplified license status for use in components
   *
   * @param forceRefresh - If true, bypasses cache and fetches fresh status
   * @returns The license status for UI display
   */
  public async getLicenseStatus(forceRefresh = false): Promise<ILicenseStatus> {
    // If force refresh, clear cache first
    if (forceRefresh) {
      this.clearCache();
    }

    const cached = this.getCachedLicense();
    const isCached = cached !== undefined && this.isCacheValid(cached);

    try {
      const response = await this.validateLicense();

      return {
        isValid: response.valid,
        isValidating: false,
        isChecked: true,
        tier: response.tier,
        features: response.features || [],
        expiresAt: response.expiresAt
          ? new Date(response.expiresAt)
          : undefined,
        error: response.valid
          ? undefined
          : this.getErrorMessage(response.reason),
        isCached,
      };
    } catch {
      // On error, if we have any cached data (even expired), use it
      // This implements "fail open" for enterprise customers
      if (cached) {
        logWarning(
          LOG_SOURCE,
          "API error, falling back to cached license (fail open)",
          "getLicenseStatus"
        );
        return {
          isValid: cached.response.valid,
          isValidating: false,
          isChecked: true,
          tier: cached.response.tier,
          features: cached.response.features || [],
          expiresAt: cached.response.expiresAt
            ? new Date(cached.response.expiresAt)
            : undefined,
          error: undefined, // Don't show error if using cached valid license
          isCached: true,
        };
      }

      // No cache at all - assume valid (fail open for enterprise)
      logWarning(
        LOG_SOURCE,
        "API error and no cache, assuming valid (fail open)",
        "getLicenseStatus"
      );
      return {
        isValid: true, // Fail open - assume valid
        isValidating: false,
        isChecked: true,
        tier: undefined,
        features: [],
        expiresAt: undefined,
        error: undefined,
        isCached: false,
      };
    }
  }

  /**
   * Gets a user-friendly error message for a license validation failure reason
   */
  private getErrorMessage(
    reason: ILicenseValidationResponse["reason"]
  ): string {
    switch (reason) {
      case "tenant_not_registered":
        return "This tenant is not registered. Please purchase a license at store.helvety.com";
      case "subscription_expired":
        return "Your subscription has expired. Please renew at store.helvety.com";
      case "subscription_canceled":
        return "Your subscription has been canceled. Please resubscribe at store.helvety.com";
      case "subscription_inactive":
        return "Your subscription is not active. Please contact support.";
      case "missing_product_id":
      case "invalid_product_id":
        return "Invalid license configuration. Please update the extension.";
      case "rate_limit_exceeded":
        return "Too many license checks. Please try again later.";
      case "server_error":
        return "Unable to verify license. Please try again later.";
      default:
        return "License validation failed. Please contact support.";
    }
  }

  /**
   * Clears the cached license status
   */
  public clearCache(): void {
    try {
      localStorage.removeItem(this.getCacheKey());
      logInfo(LOG_SOURCE, "License cache cleared", "");
    } catch {
      // Ignore errors when clearing cache
    }
  }

  /**
   * Gets the extracted tenant ID
   */
  public getTenantId(): string | undefined {
    return this.tenantId;
  }

  /**
   * Checks if a specific feature is available based on the license
   *
   * @param feature - The feature to check
   * @param licenseStatus - The current license status
   * @returns true if the feature is available, false otherwise
   */
  public static hasFeature(
    feature: string,
    licenseStatus: ILicenseStatus
  ): boolean {
    if (!licenseStatus.isValid) {
      return false;
    }
    return licenseStatus.features.indexOf(feature) !== -1;
  }
}
