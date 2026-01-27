/**
 * Validation utility functions
 * 
 * Provides reusable validation functions for common data types and structures
 * used throughout the application. These functions perform runtime validation
 * to ensure data integrity and type safety.
 */

import { ISite } from '../types/Site';

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
  if (!site || typeof site !== 'object') {
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
  if (!obj || typeof obj !== 'object' || obj === null) {
    return false;
  }
  
  const objRecord = obj as Record<string, unknown>;
  
  if (!(property in objRecord)) {
    return false;
  }
  
  const value = objRecord[property];
  
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
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
