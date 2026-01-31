/**
 * License-related types for SPFx extension
 */

/**
 * License validation response from the API
 */
export interface ILicenseValidationResponse {
  /** Whether the license is valid */
  valid: boolean;
  /** Subscription tier (e.g., 'helvety-spo-explorer-basic-monthly') */
  tier?: string;
  /** Features enabled for this tier */
  features?: string[];
  /** When the license expires (ISO 8601 string) */
  expiresAt?: string;
  /** Grace period in days after expiration */
  gracePeriodDays?: number;
  /** Reason for invalid license */
  reason?:
    | "tenant_not_registered"
    | "subscription_expired"
    | "subscription_canceled"
    | "subscription_inactive"
    | "missing_tenant_id"
    | "invalid_tenant_id"
    | "rate_limit_exceeded"
    | "server_error";
}

/**
 * Cached license status with metadata
 */
export interface ICachedLicenseStatus {
  /** The license validation response */
  response: ILicenseValidationResponse;
  /** When the cache was created (timestamp) */
  cachedAt: number;
  /** The tenant ID this cache is for */
  tenantId: string;
}

/**
 * License status for use in components
 */
export interface ILicenseStatus {
  /** Whether the license is valid and active */
  isValid: boolean;
  /** Whether the license is being validated */
  isValidating: boolean;
  /** Whether the license check has completed (true after first check, regardless of result) */
  isChecked: boolean;
  /** The subscription tier if licensed */
  tier: string | undefined;
  /** Features available to this tenant */
  features: string[];
  /** When the license expires */
  expiresAt: Date | undefined;
  /** Error message if validation failed */
  error: string | undefined;
  /** Whether this is cached data (potentially stale) */
  isCached: boolean;
}

/**
 * License features available
 */
export const LICENSE_FEATURES = {
  BASIC_NAVIGATION: "basic_navigation",
  FAVORITES: "favorites",
  SEARCH: "search",
  PRIORITY_SUPPORT: "priority_support",
  CUSTOM_BRANDING: "custom_branding",
} as const;

export type LicenseFeature =
  (typeof LICENSE_FEATURES)[keyof typeof LICENSE_FEATURES];
