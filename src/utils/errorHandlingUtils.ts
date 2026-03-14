/**
 * Common error handling patterns and utilities
 *
 * Provides reusable error handling functions and patterns used throughout
 * the application. These utilities help standardize error handling and
 * provide consistent error recovery strategies.
 */

// Utils
import {
  logError,
  extractErrorMessage,
  ErrorCategory,
  categorizeError,
} from "./errorUtils";
import { isValidFunction } from "./validationUtils";

// Types
import { ApiError, PermissionError, ValidationError } from "./errors";

const LOG_SOURCE = "errorHandlingUtils";

function maskUserIdentifier(userId: string): string {
  const trimmed = userId.trim();
  const atIndex = trimmed.indexOf("@");
  if (atIndex > 1) {
    const local = trimmed.slice(0, atIndex);
    const domain = trimmed.slice(atIndex + 1);
    return `${local.slice(0, 2)}***@${domain}`;
  }
  if (trimmed.length <= 3) {
    return "***";
  }
  return `${trimmed.slice(0, 3)}***`;
}

function sanitizeUrlForLogs(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url;
  }
}

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
    parts.push(`for user: ${maskUserIdentifier(userId)}`);
  }

  if (details) {
    parts.push(`- ${details}`);
  }

  return parts.join(" ");
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
 * Error categorization:
 * - Network errors (timeout, connection issues) → ApiError
 * - Permission errors (401, 403) → PermissionError
 * - Validation errors (400, 422, parsing errors) → ValidationError
 * - Unknown errors → Generic Error
 *
 * Edge cases handled:
 * - Already standardized errors are returned as-is (no double-wrapping)
 * - Errors without messages use the defaultMessage
 * - Null/undefined errors are converted to Error with defaultMessage
 *
 * @param error - The error to standardize
 * @param defaultMessage - Default message if error message cannot be extracted
 * @param context - Additional context about where the error occurred
 * @returns A standardized error (ApiError, PermissionError, ValidationError, or Error)
 *
 * @example
 * ```typescript
 * // Network error example
 * try {
 *   await fetchData();
 * } catch (err: unknown) {
 *   const standardizedError = createStandardizedError(
 *     err,
 *     'Failed to fetch data',
 *     'DataService.fetchData'
 *   );
 *   // standardizedError is ApiError for network issues
 * }
 *
 * // Permission error example
 * try {
 *   await accessProtectedResource();
 * } catch (err: unknown) {
 *   const standardizedError = createStandardizedError(
 *     err,
 *     'Access denied',
 *     'ResourceService.accessProtectedResource'
 *   );
 *   // standardizedError is PermissionError for 401/403
 * }
 *
 * // Already standardized error (no double-wrapping)
 * const apiError = new ApiError('Network error');
 * const result = createStandardizedError(apiError, 'Default message');
 * // result === apiError (same reference, not wrapped again)
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

/**
 * Handles SharePoint API errors and throws category-specific error types.
 */
export function handleSharePointApiError(
  error: unknown,
  context: {
    pageContext: {
      web: { absoluteUrl: string };
      site: { absoluteUrl: string };
    };
  },
  logSource: string,
  apiUrl: string,
  defaultErrorMessage: string
): never {
  const errorMessage: string = extractErrorMessage(error);
  const errorCategory: ErrorCategory = categorizeError(error);
  const siteUrl: string = sanitizeUrlForLogs(
    context.pageContext.site.absoluteUrl
  );
  const webUrl: string = sanitizeUrlForLogs(
    context.pageContext.web.absoluteUrl
  );
  const safeApiUrl = sanitizeUrlForLogs(apiUrl);
  const errorContext: string = formatErrorContext(
    "getSites - SharePoint API failed",
    undefined,
    `Category: ${errorCategory}. Site URL: ${siteUrl}, Web URL: ${webUrl}. SharePoint API URL: ${safeApiUrl}. Error: ${errorMessage}`
  );

  logError(logSource, error, errorContext);

  const operationContext: string = formatErrorContext(
    "getSites - SharePoint API failed",
    undefined,
    `Site: ${siteUrl}, Web: ${webUrl}`
  );

  if (errorCategory === ErrorCategory.PERMISSION) {
    throw new PermissionError(
      "Unable to fetch sites from SharePoint. Please check your permissions and try again.",
      error,
      operationContext
    );
  }

  if (errorCategory === ErrorCategory.NETWORK) {
    throw new ApiError(
      "Unable to fetch sites from SharePoint. Please check your network connection and try again.",
      undefined,
      apiUrl,
      error,
      operationContext
    );
  }

  const baseMessage: string = `${defaultErrorMessage}${errorMessage ? ` Details: ${errorMessage}` : ""}`;
  throw createStandardizedError(error, baseMessage, operationContext);
}

// Re-export timeout utility for backward compatibility
export { withTimeout } from "./errorRetryUtils";

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
      logError(LOG_SOURCE, error, "Unhandled error in async operation");
    }

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    // If no default value, rethrow
    throw error;
  }
}
