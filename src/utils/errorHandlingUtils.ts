/**
 * Common error handling patterns and utilities
 * 
 * Provides reusable error handling functions and patterns used throughout
 * the application. These utilities help standardize error handling and
 * provide consistent error recovery strategies.
 */

// Utils
import { logError, extractErrorMessage, ErrorCategory, categorizeError } from './errorUtils';
import { isValidFunction } from './validationUtils';

// Types
import { ApiError, PermissionError, ValidationError } from './errors';

const LOG_SOURCE = 'errorHandlingUtils';

/**
 * Options for error handling behavior
 */
export interface IErrorHandlingOptions {
  /** Whether to log the error */
  logError?: boolean;
  /** Custom log source (defaults to 'errorHandlingUtils') */
  logSource?: string;
  /** Custom context message for logging */
  context?: string;
  /** Whether to rethrow the error */
  rethrow?: boolean;
  /** Default value to return if error occurs and rethrow is false */
  defaultValue?: unknown;
}

/**
 * Formats error context consistently across the application
 * 
 * Creates a standardized error context string that includes operation name,
 * user identifier (if provided), and additional details. This ensures consistent
 * error message formatting throughout the application.
 * 
 * @param operation - Name of the operation that failed
 * @param userId - Optional user ID for user-specific operations
 * @param details - Optional additional details about the error context
 * @returns Formatted error context string
 * 
 * @example
 * ```typescript
 * // Basic usage with operation name only
 * const context1 = formatErrorContext('Initializing SettingsService');
 * // Returns: "Initializing SettingsService"
 * 
 * // With user ID
 * const context2 = formatErrorContext('Initializing SettingsService', 'user@domain.com');
 * // Returns: "Initializing SettingsService for user: user@domain.com"
 * 
 * // With all parameters
 * const context3 = formatErrorContext('Initializing SettingsService', 'user@domain.com', 'Failed to load settings');
 * // Returns: "Initializing SettingsService for user: user@domain.com - Failed to load settings"
 * ```
 */
export function formatErrorContext(
  operation: string,
  userId?: string,
  details?: string
): string {
  const parts: string[] = [operation];
  
  if (userId) {
    parts.push(`for user: ${userId}`);
  }
  
  if (details) {
    parts.push(`- ${details}`);
  }
  
  return parts.join(' ');
}

/**
 * Formats error messages consistently across the application
 * 
 * Creates a standardized error message format that includes the base message
 * and optional details. This ensures consistent error message structure.
 * 
 * @param baseMessage - Base error message
 * @param details - Optional additional details
 * @param statusCode - Optional HTTP status code
 * @returns Formatted error message
 * 
 * @example
 * ```typescript
 * formatErrorMessage('Failed to fetch sites', 'Network timeout', 408);
 * // Returns: "Failed to fetch sites (408): Network timeout"
 * 
 * formatErrorMessage('Operation failed');
 * // Returns: "Operation failed"
 * ```
 */
export function formatErrorMessage(
  baseMessage: string,
  details?: string,
  statusCode?: number
): string {
  const parts: string[] = [baseMessage];
  
  if (statusCode !== undefined && Number.isFinite(statusCode)) {
    parts.push(`(${statusCode})`);
  }
  
  if (details) {
    parts.push(`: ${details}`);
  }
  
  return parts.join(' ');
}

/**
 * Safely executes an async function with error handling
 * 
 * Wraps an async function to catch and handle errors consistently.
 * Returns a default value on error if rethrow is false, otherwise rethrows.
 * 
 * @param fn - The async function to execute
 * @param options - Error handling options
 * @returns The result of the function or default value on error
 * @throws Re-throws the error if rethrow is true and an error occurs
 * 
 * @example
 * ```typescript
 * // With default value (never throws)
 * const result = await safeExecuteAsync(
 *   async () => await fetchData(),
 *   { defaultValue: [], logError: true, context: 'Fetching data' }
 * );
 * 
 * // With rethrow enabled (may throw)
 * try {
 *   const result = await safeExecuteAsync(
 *     async () => await criticalOperation(),
 *     { rethrow: true, logError: true, context: 'Critical operation' }
 *   );
 * } catch (err) {
 *   // Handle error
 * }
 * ```
 */
export async function safeExecuteAsync<T>(
  fn: () => Promise<T>,
  options: IErrorHandlingOptions = {}
): Promise<T> {
  const {
    logError: shouldLog = true,
    logSource = LOG_SOURCE,
    context,
    rethrow = false,
    defaultValue,
  } = options;

  try {
    return await fn();
  } catch (error: unknown) {
    if (shouldLog) {
      logError(logSource, error, context);
    }

    if (rethrow) {
      throw error;
    }

    return defaultValue as T;
  }
}

/**
 * Safely executes a synchronous function with error handling
 * 
 * Wraps a synchronous function to catch and handle errors consistently.
 * Returns a default value on error if rethrow is false, otherwise rethrows.
 * 
 * @param fn - The function to execute
 * @param options - Error handling options
 * @returns The result of the function or default value on error
 * @throws Re-throws the error if rethrow is true and an error occurs
 * 
 * @example
 * ```typescript
 * // With default value (never throws)
 * const result = safeExecuteSync(
 *   () => parseData(data),
 *   { defaultValue: null, logError: true, context: 'Parsing data' }
 * );
 * 
 * // With rethrow enabled (may throw)
 * try {
 *   const result = safeExecuteSync(
 *     () => criticalOperation(),
 *     { rethrow: true, logError: true, context: 'Critical operation' }
 *   );
 * } catch (err) {
 *   // Handle error
 * }
 * ```
 */
export function safeExecuteSync<T>(
  fn: () => T,
  options: IErrorHandlingOptions = {}
): T {
  const {
    logError: shouldLog = true,
    logSource = LOG_SOURCE,
    context,
    rethrow = false,
    defaultValue,
  } = options;

  try {
    return fn();
  } catch (error: unknown) {
    if (shouldLog) {
      logError(logSource, error, context);
    }

    if (rethrow) {
      throw error;
    }

    return defaultValue as T;
  }
}

/**
 * Creates a standardized error from an unknown error type
 * 
 * Converts various error types into a standardized error format based on
 * error category. This helps ensure consistent error handling throughout
 * the application.
 * 
 * @param error - The error to standardize
 * @param defaultMessage - Default message if error message cannot be extracted
 * @param context - Additional context about where the error occurred
 * @returns A standardized error (ApiError, PermissionError, ValidationError, or Error)
 * 
 * @example
 * ```typescript
 * try {
 *   // some operation
 * } catch (err: unknown) {
 *   const standardizedError = createStandardizedError(
 *     err,
 *     'Operation failed',
 *     'Processing user data'
 *   );
 *   // Handle standardized error
 * }
 * ```
 */
export function createStandardizedError(
  error: unknown,
  defaultMessage: string,
  context?: string
): Error {
  const errorMessage: string = extractErrorMessage(error);
  const category: ErrorCategory = categorizeError(error);
  const message: string = errorMessage || defaultMessage;

  switch (category) {
    case ErrorCategory.NETWORK:
      // Check if it's already an ApiError
      if (error instanceof ApiError) {
        return error;
      }
      // Create new ApiError
      return new ApiError(message, undefined, undefined, error, context);

    case ErrorCategory.PERMISSION:
      // Check if it's already a PermissionError
      if (error instanceof PermissionError) {
        return error;
      }
      // Create new PermissionError
      return new PermissionError(message, error, context);

    case ErrorCategory.VALIDATION:
      // Check if it's already a ValidationError
      if (error instanceof ValidationError) {
        return error;
      }
      // Create new ValidationError
      return new ValidationError(message, undefined, undefined, error, context);

    default:
      // Return a generic Error for unknown categories
      return new Error(message);
  }
}

// Re-export retry utilities for backward compatibility
export { executeWithRetry, withTimeout } from './errorRetryUtils';

/**
 * Validates and executes a callback function safely
 * 
 * Validates that the callback is a function before executing it.
 * Useful for optional callback props in React components.
 * 
 * @param callback - The callback function to execute
 * @param args - Arguments to pass to the callback
 * @returns true if callback was executed successfully, false otherwise
 * @throws Never throws - errors are caught and logged
 * 
 * @example
 * ```typescript
 * safeCallback(onClick, event); // Executes onClick(event) if it's a function
 * ```
 */
export function safeCallback<T extends unknown[]>(
  callback: ((...args: T) => void) | undefined,
  ...args: T
): boolean {
  if (!isValidFunction(callback)) {
    return false;
  }

  try {
    callback(...args);
    return true;
  } catch (error: unknown) {
    logError(LOG_SOURCE, error, 'Error executing callback');
    return false;
  }
}

/**
 * Creates an error boundary handler for async operations
 * 
 * Wraps an async operation to ensure errors are properly caught and handled.
 * Useful for operations that should never throw unhandled errors.
 * 
 * @param operation - The async operation to execute
 * @param errorHandler - Optional error handler function
 * @param defaultValue - Default value to return on error
 * @returns The result of the operation or default value on error
 * 
 * @example
 * ```typescript
 * import { logError } from './errorUtils';
 * 
 * const data = await withErrorBoundary(
 *   async () => await fetchData(),
 *   (error) => logError('DataService', error, 'Failed to fetch data'),
 *   []
 * );
 * ```
 */
export async function withErrorBoundary<T>(
  operation: () => Promise<T>,
  errorHandler?: (error: unknown) => void,
  defaultValue?: T
): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    if (isValidFunction(errorHandler)) {
      errorHandler(error);
    } else {
      logError(LOG_SOURCE, error, 'Unhandled error in async operation');
    }

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    // If no default value, rethrow
    throw error;
  }
}

// Re-export error handler factories for backward compatibility
export {
  handleApiResponseError,
  createApiErrorFromResponse,
  handleSearchApiError,
  handleWebInfosApiError,
  handleSharePointApiError,
  handleGraphApiError,
  createApiErrorHandler,
  type IApiErrorOptions,
  type IApiErrorHandlerOptions,
} from './errorHandlerFactories';
