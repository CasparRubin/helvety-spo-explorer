/**
 * Validation utility functions
 * 
 * Provides reusable validation functions for common data types and structures
 * used throughout the application. These functions perform runtime validation
 * to ensure data integrity and type safety.
 * 
 * All validation functions are pure functions that never throw exceptions.
 * They return boolean values indicating validation success or failure.
 */

import { ISite, SiteId, WebId } from '../types/Site';
import { IUserSettings } from '../services/SettingsService';

/**
 * Validates if a string is a valid URL
 * 
 * Checks if the provided string is a valid URL format. This is a basic validation
 * that ensures the URL has a proper protocol and format. Supports both absolute
 * URLs (http/https) and relative URLs (starting with /).
 * 
 * @param url - The URL string to validate
 * @returns true if the URL appears valid, false otherwise
 * 
 * @example
 * ```typescript
 * isValidUrl('https://contoso.sharepoint.com'); // Returns: true
 * isValidUrl('/sites/mysite'); // Returns: true
 * isValidUrl('invalid-url'); // Returns: false
 * ```
 */
export function isValidUrl(url: string): boolean {
  // Consistent validation pattern: early return for invalid input
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return false;
  }

  try {
    const urlObj = new URL(url);
    // Check for valid protocol (http, https, or relative URLs starting with /)
    return (
      urlObj.protocol === 'http:' ||
      urlObj.protocol === 'https:' ||
      url.startsWith('/')
    );
  } catch {
    // If URL parsing fails, check if it's a relative URL
    return url.startsWith('/');
  }
}

/**
 * Validates if a value is a non-empty string
 * 
 * Checks that the value is a string type and contains non-whitespace content.
 * 
 * @param value - The value to validate
 * @returns true if the value is a non-empty string, false otherwise
 * 
 * @example
 * ```typescript
 * isNonEmptyString('hello'); // Returns: true
 * isNonEmptyString('  '); // Returns: false
 * isNonEmptyString(null); // Returns: false
 * ```
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates if a value is a non-empty string (without trimming)
 * 
 * Checks that the value is a string type and has length > 0.
 * Unlike isNonEmptyString, this does not trim whitespace.
 * 
 * @param value - The value to validate
 * @returns true if the value is a non-empty string, false otherwise
 * 
 * @example
 * ```typescript
 * isNonEmptyStringUntrimmed('hello'); // Returns: true
 * isNonEmptyStringUntrimmed('  '); // Returns: true (whitespace is considered non-empty)
 * isNonEmptyStringUntrimmed(''); // Returns: false
 * isNonEmptyStringUntrimmed(null); // Returns: false
 * ```
 */
export function isNonEmptyStringUntrimmed(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Validates if a value is a valid site object
 * 
 * Performs runtime validation to ensure the object has the required properties
 * of an ISite interface with correct types.
 * 
 * @param site - The value to validate
 * @returns true if the value is a valid site object, false otherwise
 * 
 * @example
 * ```typescript
 * const site = { id: '123', title: 'My Site', url: 'https://...' };
 * isValidSite(site); // Returns: true
 * isValidSite({}); // Returns: false
 * ```
 */
export function isValidSite(site: unknown): site is ISite {
  // Consistent validation pattern: early return for invalid input
  if (!site || typeof site !== 'object' || site === null) {
    return false;
  }
  
  const siteObj = site as Record<string, unknown>;
  
  // Check required properties exist and have correct types
  return (
    typeof siteObj.id === 'string' &&
    siteObj.id.length > 0 &&
    typeof siteObj.title === 'string' &&
    typeof siteObj.url === 'string' &&
    siteObj.url.length > 0
  );
}

/**
 * Validates if an array contains valid site objects
 * 
 * Checks that the value is an array and all elements are valid site objects.
 * 
 * @param sites - The value to validate
 * @returns true if the value is an array of valid sites, false otherwise
 * 
 * @example
 * ```typescript
 * const sites = [{ id: '1', title: 'Site 1', url: 'https://...' }];
 * isValidSitesArray(sites); // Returns: true
 * isValidSitesArray([]); // Returns: true (empty array is valid)
 * isValidSitesArray(null); // Returns: false
 * ```
 */
export function isValidSitesArray(sites: unknown): sites is ISite[] {
  // Consistent validation pattern: early return for invalid input
  if (!Array.isArray(sites)) {
    return false;
  }
  
  // Check all elements are valid sites
  return sites.every((site: unknown): boolean => isValidSite(site));
}

/**
 * Validates if a value is a valid user ID string
 * 
 * Checks that the value is a non-empty string that can be used as a user identifier.
 * 
 * @param userId - The value to validate
 * @returns true if the value is a valid user ID, false otherwise
 * 
 * @example
 * ```typescript
 * isValidUserId('user@domain.com'); // Returns: true
 * isValidUserId(''); // Returns: false
 * isValidUserId(null); // Returns: false
 * ```
 */
export function isValidUserId(userId: unknown): userId is string {
  return isNonEmptyString(userId);
}

/**
 * Generic property validator that checks if a property exists and matches a validation function
 * 
 * This is a reusable helper for validating object properties with custom validation logic.
 * 
 * @param obj - The object to check
 * @param property - The property name to check
 * @param validator - Function that validates the property value
 * @returns true if the property exists and passes validation, false otherwise
 * 
 * @example
 * ```typescript
 * const obj = { name: 'John', age: 30 };
 * validateProperty(obj, 'name', (v) => typeof v === 'string' && v.length > 0); // Returns: true
 * validateProperty(obj, 'age', (v) => typeof v === 'number' && v > 0); // Returns: true
 * ```
 */
export function validateProperty<T>(
  obj: unknown,
  property: string,
  validator: (value: unknown) => value is T
): obj is Record<string, unknown> & { [K in typeof property]: T } {
  if (!obj || typeof obj !== 'object' || obj === null) {
    return false;
  }
  
  if (!isNonEmptyString(property)) {
    return false;
  }
  
  const objRecord = obj as Record<string, unknown>;
  
  if (!(property in objRecord)) {
    return false;
  }
  
  return validator(objRecord[property]);
}

/**
 * Validates if an object has a specific property with a specific type
 * 
 * Type-safe property validation that checks both existence and type.
 * 
 * @param obj - The object to check
 * @param property - The property name to check
 * @param expectedType - The expected type ('string', 'number', 'boolean', 'object', 'array')
 * @returns true if the property exists and has the expected type, false otherwise
 * 
 * @example
 * ```typescript
 * const obj = { name: 'John', age: 30 };
 * hasPropertyOfType(obj, 'name', 'string'); // Returns: true
 * hasPropertyOfType(obj, 'age', 'string'); // Returns: false
 * ```
 */
export function hasPropertyOfType(
  obj: unknown,
  property: string,
  expectedType: 'string' | 'number' | 'boolean' | 'object' | 'array'
): boolean {
  // Consistent validation pattern: early return for invalid input
  if (!obj || typeof obj !== 'object' || obj === null) {
    return false;
  }
  
  // Consistent validation pattern: early return if property doesn't exist
  if (!isNonEmptyString(property)) {
    return false;
  }
  
  const objRecord = obj as Record<string, unknown>;
  
  if (!(property in objRecord)) {
    return false;
  }
  
  const value = objRecord[property];
  
  // Consistent validation pattern: type checking with switch statement
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    default:
      return false;
  }
}

/**
 * Validates if a value is a plain object (not null, not array, not Date, etc.)
 * 
 * @param value - The value to validate
 * @returns true if the value is a plain object, false otherwise
 * 
 * @example
 * ```typescript
 * isPlainObject({}); // Returns: true
 * isPlainObject([]); // Returns: false
 * isPlainObject(null); // Returns: false
 * isPlainObject(new Date()); // Returns: false
 * ```
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  
  // Check if it's not an array
  if (Array.isArray(value)) {
    return false;
  }
  
  // Check if it's not a Date
  if (value instanceof Date) {
    return false;
  }
  
  // Check if it's not a RegExp
  if (value instanceof RegExp) {
    return false;
  }
  
  // Check if constructor is Object (plain object)
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

/**
 * Validates if a value is a non-empty array
 * 
 * @param value - The value to validate
 * @returns true if the value is a non-empty array, false otherwise
 * 
 * @example
 * ```typescript
 * isNonEmptyArray([1, 2, 3]); // Returns: true
 * isNonEmptyArray([]); // Returns: false
 * isNonEmptyArray(null); // Returns: false
 * ```
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Validates if an array index is within bounds
 * 
 * @param array - The array to check
 * @param index - The index to validate
 * @returns true if the index is valid for the array, false otherwise
 * 
 * @example
 * ```typescript
 * const arr = [1, 2, 3];
 * isValidArrayIndex(arr, 0); // Returns: true
 * isValidArrayIndex(arr, 3); // Returns: false
 * isValidArrayIndex(arr, -1); // Returns: false
 * ```
 */
export function isValidArrayIndex<T>(
  array: readonly T[], 
  index: number
): boolean {
  return (
    Array.isArray(array) &&
    typeof index === 'number' &&
    Number.isFinite(index) &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < array.length
  );
}

/**
 * Validates if a value is a valid user settings object
 * 
 * Performs runtime validation to ensure the object has the required properties
 * of an IUserSettings interface with correct types.
 * 
 * @param settings - The value to validate
 * @returns true if the value is a valid user settings object, false otherwise
 * 
 * @example
 * ```typescript
 * const settings = { showFullUrl: true, showPartialUrl: false, showDescription: true, openInNewTab: false };
 * isValidUserSettings(settings); // Returns: true
 * isValidUserSettings({}); // Returns: false
 * ```
 */
export function isValidUserSettings(settings: unknown): settings is IUserSettings {
  if (!isPlainObject(settings)) {
    return false;
  }
  
  const settingsObj = settings as Record<string, unknown>;
  
  // Check all required properties exist and have correct types
  return (
    typeof settingsObj.showFullUrl === 'boolean' &&
    typeof settingsObj.showPartialUrl === 'boolean' &&
    typeof settingsObj.showDescription === 'boolean' &&
    typeof settingsObj.openInNewTab === 'boolean'
  );
}

/**
 * Validates if a value is a valid string array
 * 
 * @param value - The value to validate
 * @returns true if the value is an array of strings, false otherwise
 * 
 * @example
 * ```typescript
 * isValidStringArray(['a', 'b', 'c']); // Returns: true
 * isValidStringArray([1, 2, 3]); // Returns: false
 * isValidStringArray([]); // Returns: true (empty array is valid)
 * ```
 */
export function isValidStringArray(value: unknown): value is string[] {
  // Consistent validation pattern: early return for invalid input
  if (!Array.isArray(value)) {
    return false;
  }
  
  // Consistent validation pattern: check all elements match expected type
  return value.every((item: unknown): boolean => typeof item === 'string');
}

/**
 * Validates if a value is a valid Set of strings
 * 
 * @param value - The value to validate
 * @returns true if the value is a Set containing only strings, false otherwise
 * 
 * @example
 * ```typescript
 * isValidStringSet(new Set(['a', 'b'])); // Returns: true
 * isValidStringSet(new Set([1, 2])); // Returns: false
 * isValidStringSet(new Set()); // Returns: true (empty Set is valid)
 * ```
 */
export function isValidStringSet(value: unknown): value is Set<string> {
  if (!(value instanceof Set)) {
    return false;
  }
  
  // Check all values in Set are strings
  // Use Array.from for ES5 compatibility (SPFx targets ES5)
  const setArray = Array.from(value);
  for (let i = 0; i < setArray.length; i++) {
    const item = setArray[i];
    if (typeof item !== 'string') {
      return false;
    }
  }
  
  return true;
}

/**
 * Validates if a value is a function
 * 
 * @param value - The value to validate
 * @returns true if the value is a function, false otherwise
 * 
 * @example
 * ```typescript
 * isValidFunction(() => {}); // Returns: true
 * isValidFunction('not a function'); // Returns: false
 * ```
 */
export function isValidFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * Type guard to check if a string is a valid SiteId
 * 
 * Validates that the value is a non-empty string that can be safely used as a SiteId.
 * This is used before creating branded SiteId types to ensure type safety.
 * 
 * @param value - The value to validate
 * @returns true if the value is a valid SiteId candidate, false otherwise
 * 
 * @example
 * ```typescript
 * if (isValidSiteIdCandidate(siteIdString)) {
 *   const siteId = siteIdString as SiteId; // Safe assertion
 * }
 * ```
 */
export function isValidSiteIdCandidate(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard to check if a string is a valid WebId
 * 
 * Validates that the value is a non-empty string that can be safely used as a WebId.
 * This is used before creating branded WebId types to ensure type safety.
 * 
 * @param value - The value to validate
 * @returns true if the value is a valid WebId candidate, false otherwise
 * 
 * @example
 * ```typescript
 * if (isValidWebIdCandidate(webIdString)) {
 *   const webId = webIdString as WebId; // Safe assertion
 * }
 * ```
 */
export function isValidWebIdCandidate(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Safely creates a SiteId branded type from a string
 * 
 * Validates the input and creates a SiteId branded type. Returns an empty
 * SiteId if validation fails. This function provides type safety by ensuring
 * only validated strings are used as SiteId, preventing accidental mixing
 * with WebId or other string types.
 * 
 * @param value - The string value to convert to SiteId
 * @returns A SiteId branded type (empty string if validation fails)
 * 
 * @example
 * ```typescript
 * const siteId = createSiteId('12345678-1234-1234-1234-123456789012');
 * // Returns: SiteId type
 * 
 * const invalidId = createSiteId('');
 * // Returns: '' as SiteId (empty but valid SiteId type)
 * ```
 */
export function createSiteId(value: string): SiteId {
  return (isValidSiteIdCandidate(value) ? value : '') as SiteId;
}

/**
 * Safely creates a WebId branded type from a string
 * 
 * Validates the input and creates a WebId branded type. Returns undefined
 * if validation fails. This function provides type safety by ensuring
 * only validated strings are used as WebId, preventing accidental mixing
 * with SiteId or other string types.
 * 
 * @param value - The string value to convert to WebId
 * @returns A WebId branded type or undefined if validation fails
 * 
 * @example
 * ```typescript
 * const webId = createWebId('12345678-1234-1234-1234-123456789012');
 * // Returns: WebId type
 * 
 * const invalidId = createWebId('');
 * // Returns: undefined
 * ```
 */
export function createWebId(value: string): WebId | undefined {
  return isValidWebIdCandidate(value) ? (value as WebId) : undefined;
}
