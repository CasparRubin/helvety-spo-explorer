/**
 * Shared service utility functions
 *
 * Provides common patterns and utilities used across multiple services,
 * reducing code duplication and ensuring consistency.
 */

import { DEFAULT_USER_ID, STORAGE_SCHEMA } from "./constants";
import { isValidUserId } from "./validationUtils";
import { logWarning } from "./errorUtils";

/**
 * Normalizes and validates a user ID
 *
 * Validates the user ID and returns either the valid ID or the default.
 * This pattern is used consistently across services that require user identification.
 *
 * @param userId - The user ID to normalize
 * @param logSource - Source identifier for logging (optional)
 * @returns Normalized user ID (validated or default)
 *
 * @example
 * ```typescript
 * const normalizedId = normalizeUserId(userId, 'FavoriteService');
 * ```
 */
export function normalizeUserId(userId: string, logSource?: string): string {
  if (isValidUserId(userId)) {
    return userId;
  }

  if (logSource) {
    const errorMessage: string = formatValidationErrorMessage(
      "userId",
      "normalizeUserId",
      userId
    );
    logWarning(logSource, `${errorMessage}, using default`, "normalizeUserId");
  }

  return DEFAULT_USER_ID;
}

/**
 * Generates a storage key for user-specific data
 *
 * Creates a consistent storage key pattern: `{prefix}-{userId}`.
 * This ensures consistent key generation across services.
 *
 * @param prefix - The storage key prefix (e.g., STORAGE_KEYS.FAVORITES_PREFIX)
 * @param userId - The user ID
 * @returns Storage key string
 *
 * @example
 * ```typescript
 * const key = generateStorageKey(STORAGE_KEYS.FAVORITES_PREFIX, userId);
 * // Returns: 'helvety-spo-favorites-user@domain.com'
 * ```
 */
export function generateStorageKey(prefix: string, userId: string): string {
  const host =
    typeof window !== "undefined" && window.location?.hostname
      ? window.location.hostname.toLowerCase()
      : "unknown-host";
  const userHash = hashUserIdentifier(userId);
  return `${STORAGE_SCHEMA.NAMESPACE}:${host}:v${STORAGE_SCHEMA.VERSION}:${prefix}:${userHash}`;
}

/**
 * Legacy key format used before namespacing/versioning hardening.
 */
export function generateLegacyStorageKey(
  prefix: string,
  userId: string
): string {
  return `${prefix}-${userId}`;
}

/**
 * Fast deterministic identifier hash used only for local storage key obfuscation.
 * Not cryptographic; intended to avoid embedding raw user IDs in key names.
 */
function hashUserIdentifier(value: string): string {
  let hash = 0x811c9dc5; // FNV-1a 32-bit offset basis
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const hex = (hash >>> 0).toString(16);
  return hex.length >= 8 ? hex : `${"00000000".slice(hex.length)}${hex}`;
}

/**
 * Formats a standardized validation error message
 *
 * Creates consistent validation error messages across all services.
 *
 * @param valueName - Name of the value that failed validation
 * @param operationName - Name of the operation where validation failed
 * @param value - The invalid value (optional, for logging)
 * @returns Formatted error message
 *
 * @example
 * ```typescript
 * const message = formatValidationErrorMessage('URL', 'addFavorite', url);
 * // Returns: "Invalid URL provided to addFavorite: <url>"
 * ```
 */
export function formatValidationErrorMessage(
  valueName: string,
  operationName: string,
  value?: unknown
): string {
  const valueStr: string = value !== undefined ? `: ${String(value)}` : "";
  return `Invalid ${valueName} provided to ${operationName}${valueStr}`;
}

/**
 * Validates and handles invalid input with consistent error handling pattern
 *
 * Common pattern used across services for validating inputs, logging errors,
 * and returning early on validation failure. This reduces code duplication
 * in service methods.
 *
 * @param isValid - Whether the input is valid
 * @param logSource - Source identifier for logging
 * @param operationName - Name of the operation (for error messages)
 * @param valueName - Name of the value (for error messages)
 * @param value - The invalid value (optional, for logging)
 * @returns true if input is valid, false otherwise
 *
 * @example
 * ```typescript
 * // In FavoriteService.addFavorite
 * const validationResult = validateAndNormalizeUrl(url);
 * if (!validateAndHandleInvalidInput(
 *   validationResult.isValid,
 *   'FavoriteService',
 *   'addFavorite',
 *   'URL',
 *   url
 * )) {
 *   return; // Early return on invalid input
 * }
 *
 * // In SettingsService.updateSettings
 * if (!validateAndHandleInvalidInput(
 *   isPlainObject(updates),
 *   'SettingsService',
 *   'updateSettings',
 *   'updates object'
 * )) {
 *   return; // Early return on invalid input
 * }
 * ```
 */
export function validateAndHandleInvalidInput(
  isValid: boolean,
  logSource: string,
  operationName: string,
  valueName: string,
  value?: unknown
): boolean {
  if (isValid) {
    return true;
  }

  const errorMessage: string = formatValidationErrorMessage(
    valueName,
    operationName,
    value
  );
  logWarning(logSource, errorMessage, operationName);
  return false;
}
