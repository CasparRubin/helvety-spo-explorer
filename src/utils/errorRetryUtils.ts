/**
 * Error retry and timeout utilities
 * 
 * Provides utilities for retrying failed operations and adding timeouts
 * to prevent hanging requests. These utilities are useful for network
 * operations that may fail transiently.
 */

// Types
import { ApiError } from './errors';

// Constants
import { TIMEOUTS } from './constants';

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
 * @throws ApiError with status code 408 (Request Timeout) if timeout occurs
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
