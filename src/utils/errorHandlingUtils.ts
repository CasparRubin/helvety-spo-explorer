/**
 * Common error handling patterns and utilities
 * 
 * Provides reusable error handling functions and patterns used throughout
 * the application. These utilities help standardize error handling and
 * provide consistent error recovery strategies.
 */

import { logError, logWarning, extractErrorMessage, parseApiError, ErrorCategory, categorizeError } from './errorUtils';
import { ApiError, PermissionError, ValidationError } from './errors';
import { isValidFunction } from './validationUtils';
import { TIMEOUTS } from './constants';

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

/**
 * Handles errors with retry logic
 * 
 * Executes a function with automatic retry on failure. Useful for network
 * operations that may fail transiently.
 * 
 * @param fn - The async function to execute with retries
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param retryDelay - Delay in milliseconds between retries (default: 1000)
 * @param shouldRetry - Optional function to determine if error should be retried
 * @returns The result of the function
 * @throws The last error if all retries fail
 * 
 * @example
 * ```typescript
 * import { ApiError } from './errors';
 * 
 * // Retry on transient server errors (503 Service Unavailable)
 * const result = await executeWithRetry(
 *   async () => await fetchData(),
 *   3, // max retries
 *   1000, // 1 second delay between retries
 *   (error) => error instanceof ApiError && error.statusCode === 503
 * );
 * 
 * // Retry on any network error
 * const result2 = await executeWithRetry(
 *   async () => await apiCall(),
 *   5, // max retries
 *   2000, // 2 second delay
 *   (error) => error instanceof ApiError
 * );
 * ```
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000,
  shouldRetry?: (error: unknown) => boolean
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      // Check if we should retry this error
      if (shouldRetry && !shouldRetry(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying
      await new Promise((resolve: (value: void) => void): void => {
        setTimeout(resolve, retryDelay);
      });
    }
  }

  throw lastError;
}

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

/**
 * Options for handling API response errors
 */
export interface IApiErrorOptions {
  /** Log source for error logging */
  logSource: string;
  /** API endpoint URL */
  apiUrl: string;
  /** Default error message if parsing fails */
  defaultErrorMessage: string;
  /** Operation context for error messages */
  operationContext: string;
}

/**
 * Handles API response errors and creates appropriate error types
 * 
 * Standardizes API error handling by parsing error responses and creating
 * appropriate error types (ApiError, PermissionError) based on status codes.
 * 
 * @param response - The HTTP response object
 * @param options - Error handling options
 * @returns Promise that resolves to error text
 * @throws ApiError or PermissionError based on response status
 * 
 * @example
 * ```typescript
 * const response = await fetch(url);
 * if (!response.ok) {
 *   await handleApiResponseError(response, {
 *     logSource: 'SiteService',
 *     apiUrl: url,
 *     defaultErrorMessage: 'Failed to fetch sites',
 *     operationContext: 'getSitesFromSearch'
 *   });
 * }
 * ```
 */
export async function handleApiResponseError(
  response: { ok: boolean; status: number; statusText: string; text: () => Promise<string> },
  options: IApiErrorOptions
): Promise<never> {
  const { logSource, apiUrl, defaultErrorMessage, operationContext } = options;
  
  const errorText: string = await response.text();
  const errorMessage: string = parseApiError(errorText, defaultErrorMessage, logSource);
  const statusText: string = response.statusText || `HTTP ${response.status}`;
  const detailedMessage: string = `API request failed: ${errorMessage} (${statusText}). URL: ${apiUrl}`;
  const context: string = `${operationContext} - API request failed`;
  
  // Determine error type based on status code
  if (response.status === 401 || response.status === 403) {
    logError(logSource, new Error(detailedMessage), `${context} - permission denied`);
    throw new PermissionError(detailedMessage, new Error(errorText), context);
  } else {
    logError(logSource, new Error(detailedMessage), `${context} - API error (${response.status})`);
    throw new ApiError(detailedMessage, response.status, apiUrl, new Error(errorText), context);
  }
}

/**
 * Creates an ApiError from a response object
 * 
 * Factory function for creating ApiError instances from API responses.
 * 
 * @param response - The HTTP response object
 * @param options - Error handling options
 * @returns Promise that resolves to ApiError
 * 
 * @example
 * ```typescript
 * const error = await createApiErrorFromResponse(response, {
 *   logSource: 'SiteService',
 *   apiUrl: url,
 *   defaultErrorMessage: 'Failed to fetch sites',
 *   operationContext: 'getSitesFromSearch'
 * });
 * ```
 */
export async function createApiErrorFromResponse(
  response: { ok: boolean; status: number; statusText: string; text: () => Promise<string> },
  options: IApiErrorOptions
): Promise<ApiError> {
  const { logSource, apiUrl, defaultErrorMessage, operationContext } = options;
  
  const errorText: string = await response.text();
  const errorMessage: string = parseApiError(errorText, defaultErrorMessage, logSource);
  const statusText: string = response.statusText || `HTTP ${response.status}`;
  const detailedMessage: string = `API request failed: ${errorMessage} (${statusText}). URL: ${apiUrl}`;
  const context: string = `${operationContext} - API request failed`;
  
  return new ApiError(detailedMessage, response.status, apiUrl, new Error(errorText), context);
}

/**
 * Handles search API errors with fallback context
 * 
 * Standardizes error handling for search API failures, logging warnings
 * and providing context for fallback operations.
 * 
 * @param error - The error that occurred
 * @param context - Application customizer context for URL extraction
 * @param logSource - Log source identifier
 * @returns Formatted error context string
 * 
 * @example
 * ```typescript
 * try {
 *   await getSitesFromSearch();
 * } catch (error) {
 *   const context = handleSearchApiError(error, appContext, 'SiteService');
 *   // Continue to fallback API
 * }
 * ```
 */
export function handleSearchApiError(
  error: unknown,
  context: { pageContext: { web: { absoluteUrl: string }; site: { absoluteUrl: string } } },
  logSource: string
): string {
  const errorMessage: string = extractErrorMessage(error);
  const errorCategory: ErrorCategory = categorizeError(error);
  const webUrl: string = context.pageContext.web.absoluteUrl;
  const siteUrl: string = context.pageContext.site.absoluteUrl;
  const errorContext: string = formatErrorContext(
    'getSites - Search API failed, falling back to WebInfos API',
    undefined,
    `Category: ${errorCategory}. Site URL: ${siteUrl}, Web URL: ${webUrl}. Error: ${errorMessage}`
  );
  
  logWarning(logSource, errorMessage, errorContext);
  return errorContext;
}

/**
 * Handles WebInfos API errors and throws appropriate error types
 * 
 * Standardizes error handling for WebInfos API failures, creating
 * appropriate error types based on error category.
 * 
 * @param error - The error that occurred
 * @param context - Application customizer context for URL extraction
 * @param logSource - Log source identifier
 * @param errorMessages - Error message constants
 * @throws ApiError, PermissionError, or ValidationError based on error category
 * 
 * @example
 * ```typescript
 * try {
 *   await getSitesFromWebInfos();
 * } catch (error) {
 *   handleWebInfosApiError(error, appContext, 'SiteService', ERROR_MESSAGES);
 * }
 * ```
 */
export function handleWebInfosApiError(
  error: unknown,
  context: { pageContext: { web: { absoluteUrl: string }; site: { absoluteUrl: string } } },
  logSource: string,
  errorMessages: { FETCH_SITES_PERMISSIONS: string }
): never {
  const errorMessage: string = extractErrorMessage(error);
  const errorCategory: ErrorCategory = categorizeError(error);
  const siteUrl: string = context.pageContext.site.absoluteUrl;
  const webUrl: string = context.pageContext.web.absoluteUrl;
  const errorContext: string = formatErrorContext(
    'getSites - both APIs failed',
    undefined,
    `Search API error logged above. Category: ${errorCategory}. Site URL: ${siteUrl}, Web URL: ${webUrl}. Error: ${errorMessage}`
  );
  
  logError(logSource, error, errorContext);
  
  const operationContext: string = formatErrorContext('getSites - both APIs failed', undefined, `Site: ${siteUrl}, Web: ${webUrl}`);
  const baseMessage: string = `${errorMessages.FETCH_SITES_PERMISSIONS}${errorMessage ? ` Details: ${errorMessage}` : ''}`;
  
  // Throw appropriate custom error based on category with user-friendly messages
  if (errorCategory === ErrorCategory.PERMISSION) {
    throw new PermissionError(
      `Unable to fetch sites. Please check your permissions and try again.`,
      error,
      operationContext
    );
  } else if (errorCategory === ErrorCategory.NETWORK) {
    throw new ApiError(
      `Unable to fetch sites. Please check your network connection and try again.`,
      undefined,
      undefined,
      error,
      operationContext
    );
  } else {
    // Use standardized error for unknown/validation errors
    throw createStandardizedError(error, baseMessage, operationContext);
  }
}

/**
 * Options for creating an API error handler
 */
export interface IApiErrorHandlerOptions {
  /** Log source identifier */
  logSource: string;
  /** Operation context for error messages */
  operationContext: string;
  /** Optional context object for URL extraction */
  context?: { pageContext?: { web?: { absoluteUrl?: string }; site?: { absoluteUrl?: string } } };
  /** Default error message */
  defaultErrorMessage?: string;
  /** User-friendly error messages by category */
  userMessages?: {
    permission?: string;
    network?: string;
    validation?: string;
  };
}

/**
 * Creates a unified error handler for API operations
 * 
 * Factory function that creates a consistent error handler for API calls.
 * Handles error categorization, logging, and throws appropriate error types.
 * 
 * @param options - Error handler configuration
 * @returns Error handler function
 * 
 * @example
 * ```typescript
 * const handleError = createApiErrorHandler({
 *   logSource: 'SiteService',
 *   operationContext: 'getSites',
 *   userMessages: {
 *     permission: 'Unable to fetch sites. Please check your permissions.',
 *     network: 'Network error. Please check your connection.'
 *   }
 * });
 * 
 * try {
 *   await apiCall();
 * } catch (error) {
 *   handleError(error);
 * }
 * ```
 */
export function createApiErrorHandler(options: IApiErrorHandlerOptions): (error: unknown) => never {
  const {
    logSource,
    operationContext,
    context,
    defaultErrorMessage = 'Operation failed',
    userMessages = {},
  } = options;

  return (error: unknown): never => {
    const errorCategory: ErrorCategory = categorizeError(error);
    
    // Build context string with URLs if available
    const contextParts: string[] = [operationContext];
    if (context?.pageContext?.site?.absoluteUrl) {
      contextParts.push(`Site: ${context.pageContext.site.absoluteUrl}`);
    }
    if (context?.pageContext?.web?.absoluteUrl) {
      contextParts.push(`Web: ${context.pageContext.web.absoluteUrl}`);
    }
    const fullContext: string = formatErrorContext(
      operationContext,
      undefined,
      contextParts.length > 1 ? contextParts.slice(1).join(', ') : undefined
    );
    
    logError(logSource, error, fullContext);
    
    // Throw appropriate error based on category
    switch (errorCategory) {
      case ErrorCategory.PERMISSION:
        throw new PermissionError(
          userMessages.permission || 'Operation failed due to insufficient permissions. Please check your access and try again.',
          error,
          operationContext
        );
      
      case ErrorCategory.NETWORK:
        throw new ApiError(
          userMessages.network || 'Operation failed due to a network error. Please check your connection and try again.',
          undefined,
          undefined,
          error,
          operationContext
        );
      
      case ErrorCategory.VALIDATION:
        throw new ValidationError(
          userMessages.validation || defaultErrorMessage,
          undefined,
          undefined,
          error,
          operationContext
        );
      
      default:
        throw createStandardizedError(error, defaultErrorMessage, operationContext);
    }
  };
}

/**
 * Wraps a promise with a timeout to prevent hanging requests
 * 
 * If the promise doesn't resolve or reject within the specified timeout,
 * the promise will reject with a timeout error. This prevents API calls
 * from hanging indefinitely and causing the page to freeze.
 * 
 * @param promise - The promise to wrap with a timeout
 * @param timeoutMs - Timeout in milliseconds (defaults to API_REQUEST_TIMEOUT_MS)
 * @param errorMessage - Custom error message for timeout (optional)
 * @returns A promise that rejects with a timeout error if the original promise doesn't complete in time
 * 
 * @example
 * ```typescript
 * // Wrap an API call with a 30-second timeout
 * const sites = await withTimeout(
 *   siteService.getSites(),
 *   TIMEOUTS.API_REQUEST_TIMEOUT_MS,
 *   'Request to fetch sites timed out'
 * );
 * ```
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = TIMEOUTS.API_REQUEST_TIMEOUT_MS,
  errorMessage?: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_resolve, reject): void => {
    timeoutId = setTimeout((): void => {
      const message: string = errorMessage || `Operation timed out after ${timeoutMs}ms`;
      reject(new ApiError(
        message,
        408, // Request Timeout (statusCode)
        undefined, // apiEndpoint
        new Error(message),
        'withTimeout'
      ));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    return result;
  } catch (error: unknown) {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    throw error;
  }
}
