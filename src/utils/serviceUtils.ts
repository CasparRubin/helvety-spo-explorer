/**
 * Shared service utility functions
 * 
 * Provides common patterns and utilities used across multiple services,
 * reducing code duplication and ensuring consistency.
 */

import { DEFAULT_USER_ID } from './constants';
import { isValidUserId } from './validationUtils';
import { logWarning } from './errorUtils';

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
    logWarning(logSource, `Invalid userId provided: ${String(userId)}, using default`, 'normalizeUserId');
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
  return `${prefix}-${userId}`;
}

/**
 * Validates input before service operations
 * 
 * Common pattern for validating inputs before performing service operations.
 * Logs warnings for invalid inputs and returns validation result.
 * 
 * @param value - The value to validate
 * @param validator - Validation function
 * @param logSource - Source identifier for logging
 * @param operationName - Name of the operation (for error messages)
 * @param valueName - Name of the value (for error messages)
 * @returns Object with validation result and normalized value (if applicable)
 * 
 * @example
 * ```typescript
 * const result = validateServiceInput(
 *   url,
 *   isNonEmptyString,
 *   'FavoriteService',
 *   'addFavorite',
 *   'URL'
 * );
 * if (!result.isValid) {
 *   return; // Early return on invalid input
 * }
 * ```
 */
export function validateServiceInput<T>(
  value: unknown,
  validator: (val: unknown) => val is T,
  logSource: string,
  operationName: string,
  valueName: string
): { isValid: boolean; value?: T } {
  if (validator(value)) {
    return { isValid: true, value };
  }
  
  logWarning(logSource, `Invalid ${valueName} provided to ${operationName}: ${String(value)}`, operationName);
  return { isValid: false };
}
