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
  
  // Handle null/undefined
  if (error === null || error === undefined) {
    return false;
  }
  
  // Handle primitives
  if (typeof error !== 'object') {
    return false;
  }
  
  // Must not be an array (arrays are objects but not errors)
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
  if (error instanceof ApiError) {
    return true;
  }
  
  if (!isError(error)) {
    return false;
  }
  
  const errorWithProps = error as Error & { 
    category?: unknown;
    statusCode?: unknown;
    apiEndpoint?: unknown;
  };
  
  // ApiError must have NETWORK category
  const hasNetworkCategory: boolean = 
    errorWithProps.category === ErrorCategory.NETWORK;
  
  // Check for ApiError-specific properties with proper validation
  const hasValidStatusCode: boolean = isValidHttpStatusCode(errorWithProps.statusCode);
  const hasValidApiEndpoint: boolean = 
    typeof errorWithProps.apiEndpoint === 'string' && 
    errorWithProps.apiEndpoint.length > 0;
  const hasApiErrorProperties: boolean = hasValidStatusCode || hasValidApiEndpoint;
  
  // Check error name as additional validation
  const hasApiErrorName: boolean = error.name === 'ApiError';
  
  return hasNetworkCategory && (hasApiErrorProperties || hasApiErrorName);
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
  if (error instanceof ValidationError) {
    return true;
  }
  
  if (!isError(error)) {
    return false;
  }
  
  const errorWithProps = error as Error & { 
    category?: unknown;
    field?: unknown;
    value?: unknown;
  };
  
  // ValidationError must have VALIDATION category
  const hasValidationCategory: boolean = 
    errorWithProps.category === ErrorCategory.VALIDATION;
  
  // Check for ValidationError-specific properties with proper validation
  const hasValidField: boolean = 
    typeof errorWithProps.field === 'string' && 
    errorWithProps.field.length > 0;
  const hasValue: boolean = errorWithProps.value !== undefined && errorWithProps.value !== null;
  const hasValidationProperties: boolean = hasValidField || hasValue;
  
  // Check error name as additional validation
  const hasValidationName: boolean = error.name === 'ValidationError';
  
  return hasValidationCategory && (hasValidationProperties || hasValidationName);
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
  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return false;
  }
  
  // Must be an object (not primitive)
  if (typeof obj !== 'object') {
    return false;
  }
  
  // Must not be an array
  if (Array.isArray(obj)) {
    return false;
  }
  
  // Type-safe property access with runtime validation
  const apiError = obj as Record<string, unknown>;
  
  // Check error property exists and is an object
  if (!('error' in apiError) || typeof apiError.error !== 'object' || apiError.error === null) {
    return false;
  }
  
  const errorObj = apiError.error as Record<string, unknown>;
  
  // Check message property exists and is an object
  if (!('message' in errorObj) || typeof errorObj.message !== 'object' || errorObj.message === null) {
    return false;
  }
  
  const messageObj = errorObj.message as Record<string, unknown>;
  
  // Check value property exists and is a non-empty string
  // Additional validation: ensure value is actually a string and not just truthy
  return (
    'value' in messageObj &&
    typeof messageObj.value === 'string' &&
    messageObj.value.length > 0 &&
    messageObj.value.trim().length > 0
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
] as const;

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
] as const;

/**
 * Network error keywords
 */
const NETWORK_KEYWORDS: readonly string[] = [
  'network', 'fetch', 'timeout', 'connection', 'dns', 
  'econnrefused', 'enotfound', 'econnreset', 'etimedout',
  'failed to fetch', 'network error', 'offline'
] as const;

/**
 * Validation error keywords
 */
const VALIDATION_KEYWORDS: readonly string[] = [
  'parse', 'invalid', 'validation', 'malformed', 'syntax',
  'type error', 'format error', 'schema', '400', '422'
] as const;

/**
 * Categorizes an error based on its message or type
 * 
 * First checks if the error is a custom error class with a category,
 * then falls back to analyzing the error message.
 * 
 * @param error - The error to categorize
 * @returns The error category
 */
export function categorizeError(error: unknown): ErrorCategory {
  // First check if error is a custom AppError with explicit category
  if (error instanceof Error) {
    const category = getErrorCategoryFromObject(error);
    if (category !== undefined) {
      return category;
    }
  }
  
  // Fallback: Analyze error message for keywords
  const errorMessage: string = extractErrorMessage(error).toLowerCase();
  
  // Check HTTP status codes in error message
  const httpStatus: number | undefined = parseHttpStatusFromMessage(errorMessage);
  if (httpStatus !== undefined) {
    const category = categorizeByHttpStatus(httpStatus);
    if (category !== undefined) {
      return category;
    }
  }
  
  // Check keyword matches
  if (matchErrorKeywords(errorMessage, PERMISSION_KEYWORDS)) {
    return ErrorCategory.PERMISSION;
  }
  
  if (matchErrorKeywords(errorMessage, NETWORK_KEYWORDS)) {
    return ErrorCategory.NETWORK;
  }
  
  if (matchErrorKeywords(errorMessage, VALIDATION_KEYWORDS)) {
    return ErrorCategory.VALIDATION;
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
