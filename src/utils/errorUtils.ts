import { Log } from '@microsoft/sp-core-library';
import { ISPApiError } from '../types/Site';
import { ApiError, PermissionError, ValidationError } from './errors';
export { AppError, ApiError, PermissionError, ValidationError } from './errors';

/**
 * Error categories for better error handling and user feedback
 */
export enum ErrorCategory {
  /** Network or API related errors */
  NETWORK = 'NETWORK',
  /** Permission or authorization errors */
  PERMISSION = 'PERMISSION',
  /** Data parsing or validation errors */
  VALIDATION = 'VALIDATION',
  /** Unknown or unexpected errors */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Type guard to check if an unknown value is an Error instance
 * 
 * This type guard narrows the type from `unknown` to `Error`, allowing safe
 * access to error properties like `message` and `stack`.
 * 
 * Handles edge cases:
 * - null and undefined values
 * - Primitive types (strings, numbers, etc.)
 * - Objects that are not Error instances
 * - Error-like objects that may have lost their prototype chain
 * 
 * @param error - The value to check
 * @returns true if the value is an Error instance, false otherwise
 * 
 * @example
 * ```typescript
 * try {
 *   // some code
 * } catch (err: unknown) {
 *   if (isError(err)) {
 *     // TypeScript knows err is Error
 *     logError('Component', err);
 *   }
 * }
 * ```
 */
export function isError(error: unknown): error is Error {
  // Fast path: instanceof check (most reliable when it works)
  if (error instanceof Error) {
    return true;
  }
  
  // Early return: handle null/undefined
  if (error === null || error === undefined) {
    return false;
  }
  
  // Early return: handle primitives
  if (typeof error !== 'object') {
    return false;
  }
  
  // Early return: must not be an array (arrays are objects but not errors)
  if (Array.isArray(error)) {
    return false;
  }
  
  // Fallback: check for Error-like structure (handles serialized errors)
  // This is useful when errors are passed through boundaries that may lose prototype chain
  const errorLike = error as Record<string, unknown>;
  
  // Validate required Error properties exist and have correct types
  const hasMessage: boolean = typeof errorLike.message === 'string';
  const hasName: boolean = typeof errorLike.name === 'string' && errorLike.name.length > 0;
  const hasValidStack: boolean = 
    typeof errorLike.stack === 'string' || 
    errorLike.stack === undefined ||
    errorLike.stack === null;
  
  return hasMessage && hasName && hasValidStack;
}

/**
 * Validates HTTP status code range
 */
function isValidHttpStatusCode(statusCode: unknown): statusCode is number {
  return (
    typeof statusCode === 'number' &&
    Number.isFinite(statusCode) &&
    statusCode >= 100 &&
    statusCode < 600
  );
}

/**
 * Type guard to check if an error is an ApiError instance
 * 
 * Uses instanceof check and error structure for reliable type discrimination.
 * Handles both runtime instances and serialized errors that may have lost their prototype chain.
 * 
 * Edge cases handled:
 * - null/undefined values
 * - Non-Error objects
 * - Serialized errors (JSON.parse/stringify)
 * - Errors from different execution contexts
 * 
 * @param error - The error to check
 * @returns true if the error is an ApiError instance, false otherwise
 * 
 * @example
 * ```typescript
 * try {
 *   // some API call
 * } catch (err: unknown) {
 *   if (isApiError(err)) {
 *     // TypeScript knows err is ApiError
 *     logError('Component', err, `API call failed with status ${err.statusCode}`);
 *   }
 * }
 * ```
 */
export function isApiError(error: unknown): error is ApiError {
  // Fast path: instanceof check (most reliable)
  if (error instanceof ApiError) {
    return true;
  }
  
  // Early return: must be an Error instance
  if (!isError(error)) {
    return false;
  }
  
  // Type-safe property access with runtime validation
  const errorWithProps = error as Error & { 
    category?: unknown;
    statusCode?: unknown;
    apiEndpoint?: unknown;
  };
  
  // ApiError must have NETWORK category (primary indicator)
  const hasNetworkCategory: boolean = 
    errorWithProps.category === ErrorCategory.NETWORK;
  
  // If category doesn't match, check other indicators
  if (!hasNetworkCategory) {
    // Check error name as fallback (for serialized errors)
    return error.name === 'ApiError';
  }
  
  // Category matches - validate ApiError-specific properties
  const hasValidStatusCode: boolean = isValidHttpStatusCode(errorWithProps.statusCode);
  const hasValidApiEndpoint: boolean = 
    typeof errorWithProps.apiEndpoint === 'string' && 
    errorWithProps.apiEndpoint.length > 0;
  const hasApiErrorProperties: boolean = hasValidStatusCode || hasValidApiEndpoint;
  
  // Check error name as additional validation
  const hasApiErrorName: boolean = error.name === 'ApiError';
  
  // Must have either ApiError properties or matching name
  return hasApiErrorProperties || hasApiErrorName;
}

/**
 * Type guard to check if an error is a PermissionError instance
 * 
 * Uses instanceof check and error structure for reliable type discrimination.
 * Handles both runtime instances and serialized errors that may have lost their prototype chain.
 * 
 * Edge cases handled:
 * - null/undefined values
 * - Non-Error objects
 * - Serialized errors (JSON.parse/stringify)
 * - Errors from different execution contexts
 * 
 * @param error - The error to check
 * @returns true if the error is a PermissionError instance, false otherwise
 * 
 * @example
 * ```typescript
 * try {
 *   // some operation
 * } catch (err: unknown) {
 *   if (isPermissionError(err)) {
 *     // TypeScript knows err is PermissionError
 *     logError('Component', err, 'Permission denied');
 *   }
 * }
 * ```
 */
export function isPermissionError(error: unknown): error is PermissionError {
  if (error instanceof PermissionError) {
    return true;
  }
  
  if (!isError(error)) {
    return false;
  }
  
  const errorWithCategory = error as Error & { category?: unknown };
  
  // PermissionError must have PERMISSION category OR matching name
  return (
    errorWithCategory.category === ErrorCategory.PERMISSION ||
    error.name === 'PermissionError'
  );
}

/**
 * Type guard to check if an error is a ValidationError instance
 * 
 * Uses instanceof check and error structure for reliable type discrimination.
 * Handles both runtime instances and serialized errors that may have lost their prototype chain.
 * 
 * Edge cases handled:
 * - null/undefined values
 * - Non-Error objects
 * - Serialized errors (JSON.parse/stringify)
 * - Errors from different execution contexts
 * 
 * @param error - The error to check
 * @returns true if the error is a ValidationError instance, false otherwise
 * 
 * @example
 * ```typescript
 * try {
 *   // some validation
 * } catch (err: unknown) {
 *   if (isValidationError(err)) {
 *     // TypeScript knows err is ValidationError
 *     logError('Component', err, `Validation failed for field: ${err.field}`);
 *   }
 * }
 * ```
 */
export function isValidationError(error: unknown): error is ValidationError {
  // Fast path: instanceof check (most reliable)
  if (error instanceof ValidationError) {
    return true;
  }
  
  // Early return: must be an Error instance
  if (!isError(error)) {
    return false;
  }
  
  // Type-safe property access with runtime validation
  const errorWithProps = error as Error & { 
    category?: unknown;
    field?: unknown;
    value?: unknown;
  };
  
  // ValidationError must have VALIDATION category (primary indicator)
  const hasValidationCategory: boolean = 
    errorWithProps.category === ErrorCategory.VALIDATION;
  
  // If category doesn't match, check other indicators
  if (!hasValidationCategory) {
    // Check error name as fallback (for serialized errors)
    return error.name === 'ValidationError';
  }
  
  // Category matches - validate ValidationError-specific properties
  const hasValidField: boolean = 
    typeof errorWithProps.field === 'string' && 
    errorWithProps.field.length > 0;
  const hasValue: boolean = errorWithProps.value !== undefined && errorWithProps.value !== null;
  const hasValidationProperties: boolean = hasValidField || hasValue;
  
  // Check error name as additional validation
  const hasValidationName: boolean = error.name === 'ValidationError';
  
  // Must have either validation properties or matching name
  return hasValidationProperties || hasValidationName;
}

/**
 * Type guard to check if an object matches the SharePoint API error structure
 * 
 * Performs runtime validation to ensure the object has the expected structure
 * before type narrowing. This prevents runtime errors when accessing nested properties.
 * 
 * Edge cases handled:
 * - null/undefined values
 * - Primitive types
 * - Objects missing required nested properties
 * - Arrays (which are objects but not error structures)
 * 
 * @param obj - The object to check
 * @returns true if the object matches ISPApiError structure, false otherwise
 * 
 * @example
 * ```typescript
 * const response = await fetch(url);
 * const data = await response.json();
 * if (isSPApiError(data)) {
 *   // TypeScript knows data is ISPApiError
 *   const errorMessage = data.error.message.value;
 *   logError('ApiService', new Error(errorMessage), 'SharePoint API error');
 * }
 * ```
 */
export function isSPApiError(obj: unknown): obj is ISPApiError {
  // Early return: handle null/undefined
  if (obj === null || obj === undefined) {
    return false;
  }
  
  // Early return: must be an object (not primitive)
  if (typeof obj !== 'object') {
    return false;
  }
  
  // Early return: must not be an array
  if (Array.isArray(obj)) {
    return false;
  }
  
  // Type-safe property access with runtime validation
  const apiError = obj as Record<string, unknown>;
  
  // Validate error property exists and is an object
  if (!('error' in apiError)) {
    return false;
  }
  
  const errorValue: unknown = apiError.error;
  if (typeof errorValue !== 'object' || errorValue === null) {
    return false;
  }
  
  const errorObj = errorValue as Record<string, unknown>;
  
  // Validate message property exists and is an object
  if (!('message' in errorObj)) {
    return false;
  }
  
  const messageValue: unknown = errorObj.message;
  if (typeof messageValue !== 'object' || messageValue === null) {
    return false;
  }
  
  const messageObj = messageValue as Record<string, unknown>;
  
  // Validate value property exists and is a non-empty string
  // Additional validation: ensure value is actually a string and not just truthy
  if (!('value' in messageObj)) {
    return false;
  }
  
  const value: unknown = messageObj.value;
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.trim().length > 0
  );
}

/**
 * Extracts an error message from an unknown error type
 * 
 * Safely extracts a string message from various error types:
 * - Error instances: returns error.message
 * - Strings: returns the string as-is
 * - Other types: converts to string using String()
 * 
 * @param error - The error object (can be Error, string, or unknown type)
 * @returns A string representation of the error message
 * @throws Never throws - always returns a string
 * 
 * @example
 * ```typescript
 * try {
 *   // some code
 * } catch (err: unknown) {
 *   const message = extractErrorMessage(err);
 *   logError('Component', err, 'Operation failed');
 * }
 * ```
 */
export function extractErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message || 'Unknown error';
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error === null || error === undefined) {
    return 'Unknown error';
  }
  return String(error);
}

/**
 * Logs an error using SPFx Log utility with consistent formatting
 * 
 * Formats and logs errors consistently across the application. Handles various
 * error types (Error instances, strings, unknown types) and extracts meaningful
 * messages for logging.
 * 
 * @param source - The source/component name where the error occurred
 * @param error - The error object (can be Error, string, or unknown type)
 * @param context - Optional context information about where the error occurred
 * @throws Never throws - all errors are caught internally
 * 
 * @example
 * ```typescript
 * try {
 *   // some operation
 * } catch (err: unknown) {
 *   logError('ComponentName', err, 'Operation failed');
 * }
 * ```
 */
export function logError(source: string, error: unknown, context?: string): void {
  const errorMessage = extractErrorMessage(error);
  const contextMessage = context ? `${context}: ${errorMessage}` : errorMessage;
  const errorObj = error instanceof Error ? error : new Error(contextMessage);
  // Log.error signature: Log.error(source, error)
  Log.error(source, errorObj);
}

/**
 * Logs a warning using SPFx Log utility with consistent formatting
 * 
 * Note: Log.warn requires a ServiceScope, so we use Log.info for warnings when scope is not available.
 * Warnings are prefixed with [WARNING] for easy identification in logs.
 * 
 * @param source - The source/component name where the warning occurred
 * @param message - The warning message
 * @param context - Optional context information about where the warning occurred
 * @throws Never throws - all errors are caught internally
 * 
 * @example
 * ```typescript
 * if (someCondition) {
 *   logWarning('ComponentName', 'Unexpected condition detected', 'Operation context');
 * }
 * ```
 */
export function logWarning(source: string, message: string, context?: string): void {
  const contextMessage = context ? `${context}: ${message}` : message;
  // Log.warn requires ServiceScope which we don't have in utility functions
  // Using Log.info with [WARNING] prefix as alternative
  Log.info(source, `[WARNING] ${contextMessage}`);
}

/**
 * Logs an info message using SPFx Log utility with consistent formatting
 * 
 * Use this for informational messages that don't indicate errors or warnings.
 * Useful for debugging and tracking application flow.
 * 
 * @param source - The source/component name where the info occurred
 * @param message - The info message
 * @param context - Optional context information
 * @throws Never throws - all errors are caught internally
 * 
 * @example
 * ```typescript
 * logInfo('ComponentName', 'Operation completed successfully', 'User action');
 * ```
 */
export function logInfo(source: string, message: string, context?: string): void {
  const contextMessage: string = context ? `${context}: ${message}` : message;
  Log.info(source, contextMessage);
}

/**
 * Valid error category values
 */
const VALID_ERROR_CATEGORIES: readonly ErrorCategory[] = [
  ErrorCategory.NETWORK,
  ErrorCategory.PERMISSION,
  ErrorCategory.VALIDATION,
  ErrorCategory.UNKNOWN,
] as const satisfies readonly ErrorCategory[];

/**
 * Checks if a category value is valid
 */
function isValidErrorCategory(category: unknown): category is ErrorCategory {
  return VALID_ERROR_CATEGORIES.indexOf(category as ErrorCategory) !== -1;
}

/**
 * Extracts error category from custom error object if present
 */
function getErrorCategoryFromObject(error: Error): ErrorCategory | undefined {
  if ('category' in error) {
    const appError = error as { category: unknown };
    if (isValidErrorCategory(appError.category)) {
      return appError.category;
    }
  }
  return undefined;
}

/**
 * Parses HTTP status code from error message
 */
function parseHttpStatusFromMessage(message: string): number | undefined {
  const httpStatusMatch: RegExpMatchArray | null = message.match(/\b(40[0-9]|50[0-9])\b/);
  if (httpStatusMatch) {
    const statusCode: number = parseInt(httpStatusMatch[1], 10);
    if (Number.isFinite(statusCode) && statusCode >= 100 && statusCode < 600) {
      return statusCode;
    }
  }
  return undefined;
}

/**
 * Categorizes error based on HTTP status code
 */
function categorizeByHttpStatus(statusCode: number): ErrorCategory | undefined {
  if (statusCode === 401 || statusCode === 403) {
    return ErrorCategory.PERMISSION;
  }
  if (statusCode >= 500 || statusCode === 408 || statusCode === 504) {
    return ErrorCategory.NETWORK;
  }
  if (statusCode >= 400 && statusCode < 500) {
    return ErrorCategory.VALIDATION;
  }
  return undefined;
}

/**
 * Checks if error message matches any keywords in the provided list
 */
function matchErrorKeywords(message: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword: string): boolean => message.includes(keyword));
}

/**
 * Permission error keywords
 */
const PERMISSION_KEYWORDS: readonly string[] = [
  'permission', 'unauthorized', 'access denied', 'forbidden', 
  '401', '403', 'authentication', 'authorization', 'access token'
] as const satisfies readonly string[];

/**
 * Network error keywords
 */
const NETWORK_KEYWORDS: readonly string[] = [
  'network', 'fetch', 'timeout', 'connection', 'dns', 
  'econnrefused', 'enotfound', 'econnreset', 'etimedout',
  'failed to fetch', 'network error', 'offline'
] as const satisfies readonly string[];

/**
 * Validation error keywords
 */
const VALIDATION_KEYWORDS: readonly string[] = [
  'parse', 'invalid', 'validation', 'malformed', 'syntax',
  'type error', 'format error', 'schema', '400', '422'
] as const satisfies readonly string[];

/**
 * Categorizes error by checking for explicit category in custom error objects
 * 
 * @param error - The error to check
 * @returns Error category if found, undefined otherwise
 */
function getErrorCategoryFromCustomError(error: unknown): ErrorCategory | undefined {
  if (error instanceof Error) {
    return getErrorCategoryFromObject(error);
  }
  return undefined;
}

/**
 * Categorizes error by analyzing HTTP status codes in error message
 * 
 * @param errorMessage - The error message to analyze
 * @returns Error category if status code found, undefined otherwise
 */
function categorizeErrorByHttpStatus(errorMessage: string): ErrorCategory | undefined {
  const httpStatus: number | undefined = parseHttpStatusFromMessage(errorMessage);
  if (httpStatus !== undefined) {
    return categorizeByHttpStatus(httpStatus);
  }
  return undefined;
}

/**
 * Categorizes error by matching keywords in error message
 * 
 * @param errorMessage - The error message to analyze
 * @returns Error category if keywords match, undefined otherwise
 */
function categorizeErrorByKeywords(errorMessage: string): ErrorCategory | undefined {
  // Check keyword matches in priority order
  if (matchErrorKeywords(errorMessage, PERMISSION_KEYWORDS)) {
    return ErrorCategory.PERMISSION;
  }
  
  if (matchErrorKeywords(errorMessage, NETWORK_KEYWORDS)) {
    return ErrorCategory.NETWORK;
  }
  
  if (matchErrorKeywords(errorMessage, VALIDATION_KEYWORDS)) {
    return ErrorCategory.VALIDATION;
  }
  
  return undefined;
}

/**
 * Categorizes an error based on its message or type
 * 
 * First checks if the error is a custom error class with a category,
 * then falls back to analyzing the error message.
 * 
 * Categorization priority:
 * 1. Custom error classes (ApiError, PermissionError, ValidationError) with explicit category
 * 2. HTTP status codes in error message (401/403 = PERMISSION, 4xx = VALIDATION, 5xx = NETWORK)
 * 3. Keyword matching in error message (permission, network, validation keywords)
 * 4. Default: UNKNOWN
 * 
 * @param error - The error to categorize
 * @returns The error category
 * 
 * @example
 * ```typescript
 * // Custom error with explicit category
 * const apiError = new ApiError('Network error');
 * categorizeError(apiError); // Returns: ErrorCategory.NETWORK
 * 
 * // Error message with status code
 * const httpError = new Error('Request failed with status 403');
 * categorizeError(httpError); // Returns: ErrorCategory.PERMISSION
 * 
 * // Error message with keywords
 * const networkError = new Error('Network timeout occurred');
 * categorizeError(networkError); // Returns: ErrorCategory.NETWORK
 * 
 * // Unknown error
 * const unknownError = new Error('Something went wrong');
 * categorizeError(unknownError); // Returns: ErrorCategory.UNKNOWN
 * ```
 */
export function categorizeError(error: unknown): ErrorCategory {
  // Priority 1: Check if error is a custom AppError with explicit category
  const customCategory = getErrorCategoryFromCustomError(error);
  if (customCategory !== undefined) {
    return customCategory;
  }
  
  // Priority 2: Analyze error message for HTTP status codes
  const errorMessage: string = extractErrorMessage(error).toLowerCase();
  const httpStatusCategory = categorizeErrorByHttpStatus(errorMessage);
  if (httpStatusCategory !== undefined) {
    return httpStatusCategory;
  }
  
  // Priority 3: Check keyword matches in error message
  const keywordCategory = categorizeErrorByKeywords(errorMessage);
  if (keywordCategory !== undefined) {
    return keywordCategory;
  }
  
  // Default: unknown error type
  return ErrorCategory.UNKNOWN;
}

/**
 * Parses an error response from SharePoint API
 * 
 * Attempts to parse the error text as JSON and extract the error message.
 * Falls back to a default error message if parsing fails.
 * 
 * @param errorText - The error response text from the API
 * @param defaultMessage - Default error message to use if parsing fails
 * @param source - The source/component name for logging (optional)
 * @returns The parsed error message or default message
 * 
 * @example
 * ```typescript
 * const errorMessage = parseApiError(errorText, 'Failed to fetch data', 'SiteService');
 * throw new Error(errorMessage);
 * ```
 */
export function parseApiError(
  errorText: string,
  defaultMessage: string,
  source?: string
): string {
  let errorMessage: string = defaultMessage;
  try {
    const parsed: unknown = JSON.parse(errorText);
    if (isSPApiError(parsed)) {
      errorMessage = parsed.error?.message?.value ?? defaultMessage;
    }
  } catch (parseError: unknown) {
    // If parsing fails, use default message
    if (source) {
      logWarning(source, extractErrorMessage(parseError), 'Failed to parse error response');
    }
  }
  return errorMessage;
}
