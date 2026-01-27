/**
 * Shared localStorage utility functions
 * 
 * Provides safe, consistent localStorage operations with error handling.
 * These utilities handle common localStorage errors (QuotaExceededError, access denied, etc.)
 * and provide consistent error logging.
 */

import { logError } from './errorUtils';

const LOG_SOURCE = 'storageUtils';

/**
 * Safely get an item from localStorage
 * 
 * Retrieves a value from localStorage and parses it as JSON. Returns null if the
 * item doesn't exist or if an error occurs during retrieval or parsing.
 * 
 * @param key - The localStorage key to retrieve
 * @returns Parsed value from localStorage, or undefined if not found or on error
 * @throws Never throws - returns undefined on error (errors are caught and logged)
 * 
 * @example
 * ```typescript
 * const settings = getStorageItem<IUserSettings>('my-settings');
 * if (settings) {
 *   // Use settings
 * }
 * ```
 */
export function getStorageItem<T>(key: string): T | undefined {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return undefined;
    }
    return JSON.parse(stored) as T;
  } catch (error: unknown) {
    logError(LOG_SOURCE, error, `Error getting storage item: ${key}`);
    return undefined;
  }
}

/**
 * Safely set an item in localStorage
 * 
 * Stores a value in localStorage as JSON. Handles errors like QuotaExceededError
 * and logs them appropriately.
 * 
 * @param key - The localStorage key to store the value under
 * @param value - The value to store (will be JSON stringified)
 * @returns true if successful, false if an error occurred
 * @throws Never throws - returns false on error (errors are caught and logged)
 * 
 * @example
 * ```typescript
 * const success = setStorageItem('my-settings', { theme: 'dark' });
 * if (!success) {
 *   // Handle storage failure
 * }
 * ```
 */
export function setStorageItem<T>(key: string, value: T): boolean {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error && error.name === 'QuotaExceededError'
      ? `Storage quota exceeded - cannot save item: ${key}`
      : `Error saving storage item: ${key}`;
    logError(LOG_SOURCE, error, errorMessage);
    return false;
  }
}

/**
 * Safely remove an item from localStorage
 * 
 * Removes a value from localStorage. Handles errors gracefully.
 * 
 * @param key - The localStorage key to remove
 * @returns true if successful, false if an error occurred
 * @throws Never throws - returns false on error (errors are caught and logged)
 * 
 * @example
 * ```typescript
 * removeStorageItem('my-settings');
 * ```
 */
export function removeStorageItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error: unknown) {
    logError(LOG_SOURCE, error, `Error removing storage item: ${key}`);
    return false;
  }
}

/**
 * Check if localStorage is available
 * 
 * Tests whether localStorage is accessible and functional. Some browsers or
 * privacy modes may disable localStorage.
 * 
 * @returns true if localStorage is available, false otherwise
 * 
 * @example
 * ```typescript
 * if (isStorageAvailable()) {
 *   setStorageItem('key', value);
 * } else {
 *   // Fallback to memory storage
 * }
 * ```
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
