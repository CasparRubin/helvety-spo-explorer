import * as React from "react";
import { ApplicationCustomizerContext } from "@microsoft/sp-application-base";

import { LicenseService } from "../../services/LicenseService";
import { ILicenseStatus, LicenseFeature } from "../../types/License";
import { logError, logInfo } from "../errorUtils";

const LOG_SOURCE = "useLicense";

/**
 * Delay before starting license check (in milliseconds)
 * This ensures sites load first - core functionality takes priority
 */
const LICENSE_CHECK_DELAY_MS = 500;

/**
 * Return type for useLicense hook
 */
export interface IUseLicenseReturn {
  /** Current license status */
  license: ILicenseStatus;
  /** Function to refresh the license status */
  refresh: () => Promise<void>;
  /** Function to check if a specific feature is available */
  hasFeature: (feature: LicenseFeature) => boolean;
  /** The tenant ID for this SharePoint tenant */
  tenantId: string | undefined;
}

/**
 * Default license status - ASSUMES VALID until proven otherwise
 * This is the key to non-blocking behavior:
 * - isValid: true = don't restrict anything initially
 * - isChecked: false = we haven't verified yet
 * - isValidating: true = check is in progress (but doesn't block UI)
 */
const DEFAULT_LICENSE_STATUS: ILicenseStatus = {
  isValid: true, // Assume valid - never block core functionality
  isValidating: true, // Check is pending
  isChecked: false, // Not yet verified
  tier: undefined,
  features: [],
  expiresAt: undefined,
  error: undefined,
  isCached: false,
};

/**
 * Custom hook for managing license validation (NON-BLOCKING)
 *
 * KEY PRINCIPLE: Core functionality ALWAYS takes priority.
 * The license check should never block, delay, or interfere with loading sites.
 *
 * Behavior:
 * 1. Initially assumes license is VALID (isValid: true, isChecked: false)
 * 2. Immediately checks localStorage cache - if valid cache found, uses it
 * 3. After a delay (500ms), runs API validation in background
 * 4. Only after check completes does isChecked become true
 * 5. If unlicensed, UI can then apply restrictions (but sites already loaded)
 *
 * @param context - SharePoint application customizer context
 * @returns Object containing license status, refresh function, and feature check
 *
 * @example
 * ```typescript
 * const { license, refresh, hasFeature, tenantId } = useLicense(context);
 *
 * // Show all functionality immediately (license.isValid starts as true)
 * // Only restrict after check completes AND license is invalid
 * if (license.isChecked && !license.isValid) {
 *   // Apply restrictions (e.g., show only 2 sites)
 * }
 * ```
 */
export function useLicense(
  context: ApplicationCustomizerContext
): IUseLicenseReturn {
  const [license, setLicense] = React.useState<ILicenseStatus>(
    DEFAULT_LICENSE_STATUS
  );
  const licenseServiceRef = React.useRef<LicenseService | undefined>(undefined);
  const [tenantId, setTenantId] = React.useState<string | undefined>(undefined);

  // Store context in ref to avoid dependency on context object
  const contextRef = React.useRef<ApplicationCustomizerContext>(context);
  React.useEffect((): void => {
    contextRef.current = context;
  }, [context]);

  // Initialize license service and check cache immediately
  React.useEffect((): void => {
    try {
      const service = new LicenseService(contextRef.current);
      licenseServiceRef.current = service;
      setTenantId(service.getTenantId());

      logInfo(
        LOG_SOURCE,
        "LicenseService initialized",
        `Tenant: ${service.getTenantId() || "unknown"}`
      );

      // Immediately check cache - if we have a cached status, use it right away
      const cachedStatus = service.getQuickCacheStatus();
      if (cachedStatus) {
        logInfo(
          LOG_SOURCE,
          `Using cached license status: ${cachedStatus.isValid ? "VALID" : "INVALID"}`,
          "Quick cache hit - no API call needed"
        );
        setLicense(cachedStatus);
        // If cache is valid, we're done - no need to make API call
        // (the cache already has isChecked: true)
        return;
      }

      // No cache or expired cache - keep default (assume valid, not checked)
      logInfo(
        LOG_SOURCE,
        "No valid cache found, will validate in background",
        ""
      );
    } catch (err: unknown) {
      logError(LOG_SOURCE, err, "Error initializing LicenseService");
      // On error, assume valid (fail open for enterprise)
      setLicense({
        ...DEFAULT_LICENSE_STATUS,
        isValid: true,
        isValidating: false,
        isChecked: true,
        error: undefined, // Don't show error - fail open
      });
    }
  }, [context]);

  // Validate license function (for background validation and refresh)
  const validateLicense = React.useCallback(
    async (forceRefresh = false): Promise<void> => {
      if (!licenseServiceRef.current) {
        logError(
          LOG_SOURCE,
          new Error("LicenseService not initialized"),
          "validateLicense"
        );
        // Fail open - assume valid
        setLicense({
          ...DEFAULT_LICENSE_STATUS,
          isValid: true,
          isValidating: false,
          isChecked: true,
        });
        return;
      }

      // Don't set isValidating to true here - we don't want to trigger UI updates
      // The validation happens in background

      try {
        const status =
          await licenseServiceRef.current.getLicenseStatus(forceRefresh);
        setLicense(status);

        logInfo(
          LOG_SOURCE,
          `License validation complete: ${status.isValid ? "VALID" : "INVALID"}`,
          status.tier || status.error || ""
        );
      } catch (err: unknown) {
        logError(LOG_SOURCE, err, "Error validating license");
        // Fail open - assume valid on error
        setLicense((prev) => ({
          ...prev,
          isValid: true,
          isValidating: false,
          isChecked: true,
          error: undefined,
        }));
      }
    },
    []
  );

  // Background validation after delay (only if not already checked via cache)
  React.useEffect((): (() => void) => {
    // Skip if already checked (from cache)
    if (license.isChecked) {
      return (): void => {
        /* no cleanup needed */
      };
    }

    // Delay license check to ensure sites load first
    // Core functionality takes priority!
    const timeoutId = setTimeout((): void => {
      logInfo(
        LOG_SOURCE,
        "Starting background license validation",
        `Delay: ${LICENSE_CHECK_DELAY_MS}ms`
      );
      // eslint-disable-next-line no-void -- void operator required to satisfy @typescript-eslint/no-floating-promises
      void validateLicense().catch((err: unknown): void => {
        logError(
          LOG_SOURCE,
          err,
          "Unhandled promise rejection in validateLicense"
        );
      });
    }, LICENSE_CHECK_DELAY_MS);

    return (): void => {
      clearTimeout(timeoutId);
    };
  }, [license.isChecked, validateLicense]);

  // Refresh function that forces a new validation
  const refresh = React.useCallback(async (): Promise<void> => {
    await validateLicense(true);
  }, [validateLicense]);

  // Check if a specific feature is available
  const hasFeature = React.useCallback(
    (feature: LicenseFeature): boolean => {
      return LicenseService.hasFeature(feature, license);
    },
    [license]
  );

  return {
    license,
    refresh,
    hasFeature,
    tenantId,
  };
}
