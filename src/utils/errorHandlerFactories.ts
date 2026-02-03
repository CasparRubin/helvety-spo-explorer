/**
 * Error handler factory functions
 *
 * Provides factory functions for creating consistent error handlers for
 * different API types (SharePoint, Graph, Search, WebInfos). These factories
 * standardize error handling patterns across the application.
 */

// Utils
import {
  logError,
  logWarning,
  extractErrorMessage,
  parseApiError,
  ErrorCategory,
  categorizeError,
} from "./errorUtils";
import {
  createStandardizedError,
  formatErrorContext,
} from "./errorHandlingUtils";

// Types
import { ApiError, PermissionError, ValidationError } from "./errors";

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
 * Options for creating an API error handler
 */
export interface IApiErrorHandlerOptions {
  /** Log source identifier */
  logSource: string;
  /** Operation context for error messages */
  operationContext: string;
  /** Optional context object for URL extraction */
  context?: {
    pageContext?: {
      web?: { absoluteUrl?: string };
      site?: { absoluteUrl?: string };
    };
  };
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
  response: {
    ok: boolean;
    status: number;
    statusText: string;
    text: () => Promise<string>;
  },
  options: IApiErrorOptions
): Promise<never> {
  const { logSource, apiUrl, defaultErrorMessage, operationContext } = options;

  const errorText: string = await response.text();
  const errorMessage: string = parseApiError(
    errorText,
    defaultErrorMessage,
    logSource
  );
  const statusText: string = response.statusText || `HTTP ${response.status}`;
  const detailedMessage: string = `API request failed: ${errorMessage} (${statusText}). URL: ${apiUrl}`;
  const context: string = `${operationContext} - API request failed`;

  // Determine error type based on status code
  if (response.status === 401 || response.status === 403) {
    logError(
      logSource,
      new Error(detailedMessage),
      `${context} - permission denied`
    );
    throw new PermissionError(detailedMessage, new Error(errorText), context);
  } else {
    logError(
      logSource,
      new Error(detailedMessage),
      `${context} - API error (${response.status})`
    );
    throw new ApiError(
      detailedMessage,
      response.status,
      apiUrl,
      new Error(errorText),
      context
    );
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
  response: {
    ok: boolean;
    status: number;
    statusText: string;
    text: () => Promise<string>;
  },
  options: IApiErrorOptions
): Promise<ApiError> {
  const { logSource, apiUrl, defaultErrorMessage, operationContext } = options;

  const errorText: string = await response.text();
  const errorMessage: string = parseApiError(
    errorText,
    defaultErrorMessage,
    logSource
  );
  const statusText: string = response.statusText || `HTTP ${response.status}`;
  const detailedMessage: string = `API request failed: ${errorMessage} (${statusText}). URL: ${apiUrl}`;
  const context: string = `${operationContext} - API request failed`;

  return new ApiError(
    detailedMessage,
    response.status,
    apiUrl,
    new Error(errorText),
    context
  );
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
  context: {
    pageContext: {
      web: { absoluteUrl: string };
      site: { absoluteUrl: string };
    };
  },
  logSource: string
): string {
  const errorMessage: string = extractErrorMessage(error);
  const errorCategory: ErrorCategory = categorizeError(error);
  const webUrl: string = context.pageContext.web.absoluteUrl;
  const siteUrl: string = context.pageContext.site.absoluteUrl;
  const errorContext: string = formatErrorContext(
    "getSites - Search API failed, falling back to WebInfos API",
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
  context: {
    pageContext: {
      web: { absoluteUrl: string };
      site: { absoluteUrl: string };
    };
  },
  logSource: string,
  errorMessages: { FETCH_SITES_PERMISSIONS: string }
): never {
  const errorMessage: string = extractErrorMessage(error);
  const errorCategory: ErrorCategory = categorizeError(error);
  const siteUrl: string = context.pageContext.site.absoluteUrl;
  const webUrl: string = context.pageContext.web.absoluteUrl;
  const errorContext: string = formatErrorContext(
    "getSites - both APIs failed",
    undefined,
    `Search API error logged above. Category: ${errorCategory}. Site URL: ${siteUrl}, Web URL: ${webUrl}. Error: ${errorMessage}`
  );

  logError(logSource, error, errorContext);

  const operationContext: string = formatErrorContext(
    "getSites - both APIs failed",
    undefined,
    `Site: ${siteUrl}, Web: ${webUrl}`
  );
  const baseMessage: string = `${errorMessages.FETCH_SITES_PERMISSIONS}${errorMessage ? ` Details: ${errorMessage}` : ""}`;

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
 * Handles SharePoint API errors and throws appropriate error types
 *
 * Standardizes error handling for SharePoint API failures, creating
 * appropriate error types based on error category. SharePoint API errors have
 * a specific structure: { error: { code: string, message: { lang: string, value: string } } }
 *
 * @param error - The error that occurred
 * @param context - Application customizer context for URL extraction
 * @param logSource - Log source identifier
 * @param apiUrl - The SharePoint API URL that was called
 * @param defaultErrorMessage - Default error message if parsing fails
 * @throws ApiError, PermissionError, or ValidationError based on error category
 *
 * @example
 * ```typescript
 * try {
 *   await getSitesFromSearch();
 * } catch (error) {
 *   handleSharePointApiError(error, appContext, 'SiteService', searchUrl, 'Failed to fetch sites');
 * }
 * ```
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
  const siteUrl: string = context.pageContext.site.absoluteUrl;
  const webUrl: string = context.pageContext.web.absoluteUrl;
  const errorContext: string = formatErrorContext(
    "getSites - SharePoint API failed",
    undefined,
    `Category: ${errorCategory}. Site URL: ${siteUrl}, Web URL: ${webUrl}. SharePoint API URL: ${apiUrl}. Error: ${errorMessage}`
  );

  logError(logSource, error, errorContext);

  const operationContext: string = formatErrorContext(
    "getSites - SharePoint API failed",
    undefined,
    `Site: ${siteUrl}, Web: ${webUrl}`
  );

  // Throw appropriate custom error based on category with user-friendly messages
  if (errorCategory === ErrorCategory.PERMISSION) {
    throw new PermissionError(
      `Unable to fetch sites from SharePoint. Please check your permissions and try again.`,
      error,
      operationContext
    );
  } else if (errorCategory === ErrorCategory.NETWORK) {
    throw new ApiError(
      `Unable to fetch sites from SharePoint. Please check your network connection and try again.`,
      undefined,
      apiUrl,
      error,
      operationContext
    );
  } else {
    // Use standardized error for unknown/validation errors
    const baseMessage: string = `${defaultErrorMessage}${errorMessage ? ` Details: ${errorMessage}` : ""}`;
    throw createStandardizedError(error, baseMessage, operationContext);
  }
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
export function createApiErrorHandler(
  options: IApiErrorHandlerOptions
): (error: unknown) => never {
  const {
    logSource,
    operationContext,
    context,
    defaultErrorMessage = "Operation failed",
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
      contextParts.length > 1 ? contextParts.slice(1).join(", ") : undefined
    );

    logError(logSource, error, fullContext);

    // Throw appropriate error based on category
    switch (errorCategory) {
      case ErrorCategory.PERMISSION:
        throw new PermissionError(
          userMessages.permission ||
            "Operation failed due to insufficient permissions. Please check your access and try again.",
          error,
          operationContext
        );

      case ErrorCategory.NETWORK:
        throw new ApiError(
          userMessages.network ||
            "Operation failed due to a network error. Please check your connection and try again.",
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
        throw createStandardizedError(
          error,
          defaultErrorMessage,
          operationContext
        );
    }
  };
}
