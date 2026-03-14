/**
 * Error retry and timeout utilities
 *
 * Provides utilities for retrying failed operations and adding timeouts
 * to prevent hanging requests. These utilities are useful for network
 * operations that may fail transiently.
 */

// Types
import { ApiError } from "./errors";

// Constants
import { TIMEOUTS } from "./constants";

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
      const message: string =
        errorMessage || `Operation timed out after ${timeoutMs}ms`;
      reject(
        new ApiError(
          message,
          408, // Request Timeout (statusCode)
          undefined, // apiEndpoint
          new Error(message),
          "withTimeout"
        )
      );
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
