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
  return error instanceof Error;
}

/**
 * Type guard to check if an error is an ApiError instance
 * 
 * Uses instanceof check and error structure for reliable type discrimination.
 * Handles both runtime instances and serialized errors that may have lost their prototype chain.
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
 *     console.log(err.statusCode);
 *   }
 * }
 * ```
 */
export function isApiError(error: unknown): error is ApiError {
  // Check instanceof first (most reliable when it works)
  if (error instanceof ApiError) {
    return true;
  }
  // Fallback: check error structure (more reliable in Jest/ES5 compilation or serialized errors)
  if (!(error instanceof Error)) {
    return false;
  }
  
  // Type guard: check if error has ApiError-like structure with runtime validation
  const errorWithProps = error as Error & { 
    category?: unknown;
    statusCode?: unknown;
    apiEndpoint?: unknown;
  };
  
  // Validate category is NETWORK (ApiError always has NETWORK category)
  const hasNetworkCategory: boolean = errorWithProps.category === ErrorCategory.NETWORK;
  
  // Check for ApiError-specific properties (statusCode or apiEndpoint)
  const hasApiErrorProperties: boolean = 
    typeof errorWithProps.statusCode === 'number' || 
    typeof errorWithProps.apiEndpoint === 'string';
  
  // Check error name as additional validation
  const hasApiErrorName: boolean = error.name === 'ApiError';
  
  // ApiError must have NETWORK category AND (statusCode/apiEndpoint OR matching name)
  return hasNetworkCategory && (hasApiErrorProperties || hasApiErrorName);
}

/**
 * Type guard to check if an error is a PermissionError instance
 * 
 * Uses instanceof check and error structure for reliable type discrimination.
 * Handles both runtime instances and serialized errors that may have lost their prototype chain.
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
 *     console.log(err.category);
 *   }
 *   }
 * ```
 */
export function isPermissionError(error: unknown): error is PermissionError {
  // Check instanceof first (most reliable when it works)
  if (error instanceof PermissionError) {
    return true;
  }
  // Fallback: check error structure (more reliable in Jest/ES5 compilation or serialized errors)
  if (!(error instanceof Error) || !('category' in error)) {
    return false;
  }
  
  // Type guard: check if error has PermissionError-like structure with runtime validation
  const errorWithCategory = error as Error & { category: unknown };
  
  // Validate category is PERMISSION (PermissionError always has PERMISSION category)
  const hasPermissionCategory: boolean = errorWithCategory.category === ErrorCategory.PERMISSION;
  
  // Check error name as additional validation
  const hasPermissionName: boolean = error.name === 'PermissionError';
  
  // PermissionError must have PERMISSION category OR matching name
  return hasPermissionCategory || hasPermissionName;
}

/**
 * Type guard to check if an error is a ValidationError instance
 * 
 * Uses instanceof check and error structure for reliable type discrimination.
 * Handles both runtime instances and serialized errors that may have lost their prototype chain.
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
 *     console.log(err.field, err.value);
 *   }
 *   }
 * ```
 */
export function isValidationError(error: unknown): error is ValidationError {
  // Check instanceof first (most reliable when it works)
  if (error instanceof ValidationError) {
    return true;
  }
  // Fallback: check error structure (more reliable in Jest/ES5 compilation or serialized errors)
  if (!(error instanceof Error)) {
    return false;
  }
  
  // Type guard: check if error has ValidationError-like structure with runtime validation
  const errorWithProps = error as Error & { 
    category?: unknown;
    field?: unknown;
    value?: unknown;
  };
  
  // Validate category is VALIDATION (ValidationError always has VALIDATION category)
  const hasValidationCategory: boolean = errorWithProps.category === ErrorCategory.VALIDATION;
  
  // Check for ValidationError-specific properties (field or value)
  const hasValidationProperties: boolean = 
    typeof errorWithProps.field === 'string' || 
    errorWithProps.value !== undefined;
  
  // Check error name as additional validation
  const hasValidationName: boolean = error.name === 'ValidationError';
  
  // ValidationError must have VALIDATION category AND (field/value properties OR matching name)
  return hasValidationCategory && (hasValidationProperties || hasValidationName);
}

/**
 * Type guard to check if an object matches the SharePoint API error structure
 * 
 * Performs runtime validation to ensure the object has the expected structure
 * before type narrowing. This prevents runtime errors when accessing nested properties.
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
 *   console.log(data.error.message.value);
 * }
 * ```
 */
export function isSPApiError(obj: unknown): obj is ISPApiError {
  if (!obj || typeof obj !== 'object') {
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
  
  // Check value property exists and is a string
  return 'value' in messageObj && typeof messageObj.value === 'string';
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
 * @param source - The source/component name where the error occurred
 * @param error - The error object (can be Error, string, or unknown type)
 * @param context - Optional context information about where the error occurred
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
 * Note: Log.warn requires a ServiceScope, so we use Log.info for warnings when scope is not available
 * @param source - The source/component name where the warning occurred
 * @param message - The warning message
 * @param context - Optional context information about where the warning occurred
 */
export function logWarning(source: string, message: string, context?: string): void {
  const contextMessage = context ? `${context}: ${message}` : message;
  // Log.warn requires ServiceScope which we don't have in utility functions
  // Using Log.info with [WARNING] prefix as alternative
  Log.info(source, `[WARNING] ${contextMessage}`);
}

/**
 * Logs an info message using SPFx Log utility with consistent formatting
 * @param source - The source/component name where the info occurred
 * @param message - The info message
 * @param context - Optional context information
 */
export function logInfo(source: string, message: string, context?: string): void {
  const contextMessage: string = context ? `${context}: ${message}` : message;
  Log.info(source, contextMessage);
}

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
  // Strategy: First check if error is a custom AppError with explicit category
  // This is the most reliable method since custom errors set category explicitly
  
  // Check if it's a custom error with a category property
  if (error instanceof Error && 'category' in error) {
    const appError = error as { category: ErrorCategory };
    
    // Validate that the category is a valid ErrorCategory enum value
    // This prevents issues if error object has invalid category value
    const validCategories: ErrorCategory[] = [
      ErrorCategory.NETWORK,
      ErrorCategory.PERMISSION,
      ErrorCategory.VALIDATION,
      ErrorCategory.UNKNOWN,
    ];
    
    // Only trust the category if it's a valid enum value
    // Use indexOf for ES5 compatibility (SPFx targets ES5)
    if (validCategories.indexOf(appError.category) !== -1) {
      return appError.category;
    }
    // If category exists but is invalid, fall through to message analysis
  }
  
  // Fallback strategy: Analyze error message for keywords
  // This handles native errors, string errors, and custom errors without category
  // Convert to lowercase for case-insensitive matching
  const errorMessage: string = extractErrorMessage(error).toLowerCase();
  
  // Permission errors: user lacks access or authentication failed
  if (errorMessage.includes('permission') || 
      errorMessage.includes('unauthorized') || 
      errorMessage.includes('access denied')) {
    return ErrorCategory.PERMISSION;
  }
  
  // Network errors: connection issues, timeouts, fetch failures
  if (errorMessage.includes('network') || 
      errorMessage.includes('fetch') || 
      errorMessage.includes('timeout') || 
      errorMessage.includes('connection')) {
    return ErrorCategory.NETWORK;
  }
  
  // Validation errors: data format issues, parsing failures
  if (errorMessage.includes('parse') || 
      errorMessage.includes('invalid') || 
      errorMessage.includes('validation')) {
    return ErrorCategory.VALIDATION;
  }
  
  // Default: unknown error type (catch-all for unclassified errors)
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
