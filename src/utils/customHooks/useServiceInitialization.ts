/**
 * Reusable hook for service initialization pattern
 *
 * This hook encapsulates the common pattern of initializing a service in a React component,
 * handling errors gracefully, and managing service lifecycle. It reduces code duplication
 * across hooks that need to initialize services.
 *
 * Key features:
 * - Automatic user ID normalization and validation
 * - Consistent error handling with safeExecuteSync
 * - Service lifecycle management via refs
 * - Callback support for initialization success/failure
 * - Reduces ~30 lines of duplicated code per hook
 *
 * @module useServiceInitialization
 */

import * as React from "react";
import { DEFAULT_USER_ID } from "../constants";
import { isValidUserId } from "../validationUtils";
import { safeExecuteSync, formatErrorContext } from "../errorHandlingUtils";

/**
 * Options for service initialization
 */
export interface IServiceInitializationOptions<TService> {
  /** Factory function to create the service instance */
  createService: (normalizedId: string) => TService;
  /** User ID or context identifier for the service */
  userId: string;
  /** Log source name for error logging */
  logSource: string;
  /** Service name for error messages */
  serviceName: string;
  /** Callback to handle successful initialization and load initial data */
  onInitialized?: (service: TService, normalizedId: string) => void;
  /** Callback to handle initialization failure */
  onInitializationFailed?: () => void;
}

/**
 * Return type for useServiceInitialization hook
 */
export interface IUseServiceInitializationReturn<TService> {
  /** Reference to the service instance (may be undefined if initialization failed) */
  serviceRef: React.MutableRefObject<TService | undefined>;
  /** Normalized user ID used for service initialization */
  normalizedUserId: string;
}

/**
 * Custom hook for initializing services with consistent error handling
 *
 * This hook handles:
 * - User ID normalization and validation
 * - Service creation with error handling
 * - Fallback handling if initialization fails
 * - Consistent error logging
 *
 * Key features:
 * - Automatic user ID normalization (invalid IDs fall back to DEFAULT_USER_ID)
 * - Service lifecycle management via refs (service persists across renders)
 * - Callback refs prevent infinite loops (callbacks can change without re-initializing)
 * - Error handling with safeExecuteSync (never throws, always logs errors)
 *
 * Edge cases handled:
 * - Invalid user IDs are normalized to DEFAULT_USER_ID
 * - Service creation errors are caught and logged (serviceRef remains undefined)
 * - Callback errors are caught and logged (don't break initialization)
 * - Callbacks can be updated without re-initializing the service
 *
 * @param options - Initialization options
 * @returns Object containing service ref and normalized user ID
 *
 * @example
 * ```typescript
 * // Basic usage with SettingsService
 * const { serviceRef, normalizedUserId } = useServiceInitialization({
 *   createService: (userId) => new SettingsService(userId),
 *   userId: currentUserId,
 *   logSource: 'useSettings',
 *   serviceName: 'SettingsService',
 *   onInitialized: (service) => {
 *     const settings = service.getSettings();
 *     setSettings(settings);
 *   },
 *   onInitializationFailed: () => {
 *     setSettings(DEFAULT_SETTINGS);
 *   }
 * });
 *
 * // Using the service ref (service may be undefined if initialization failed)
 * const updateSettings = useCallback((newSettings: IUserSettings) => {
 *   if (serviceRef.current) {
 *     serviceRef.current.updateSettings(newSettings);
 *   }
 * }, []);
 *
 * // Edge case: Invalid user ID (normalized to DEFAULT_USER_ID)
 * const { normalizedUserId } = useServiceInitialization({
 *   createService: (userId) => new FavoriteService(userId),
 *   userId: '', // Invalid - will be normalized
 *   logSource: 'useFavorites',
 *   serviceName: 'FavoriteService',
 * });
 * // normalizedUserId === DEFAULT_USER_ID
 * ```
 */
export function useServiceInitialization<TService>(
  options: IServiceInitializationOptions<TService>
): IUseServiceInitializationReturn<TService> {
  const {
    createService,
    userId,
    logSource,
    serviceName,
    onInitialized,
    onInitializationFailed,
  } = options;

  const serviceRef = React.useRef<TService | undefined>(undefined);

  // Store callbacks in refs to prevent infinite loops
  // Refs allow us to always use the latest callback versions without triggering re-runs
  const onInitializedRef = React.useRef(onInitialized);
  const onInitializationFailedRef = React.useRef(onInitializationFailed);

  // Update refs when callbacks change (doesn't trigger re-renders)
  React.useEffect((): void => {
    onInitializedRef.current = onInitialized;
    onInitializationFailedRef.current = onInitializationFailed;
  }, [onInitialized, onInitializationFailed]);

  // Normalize user ID once
  const normalizedUserId: string = React.useMemo((): string => {
    return isValidUserId(userId) ? userId : DEFAULT_USER_ID;
  }, [userId]);

  // Initialize service
  // Only re-run when normalizedUserId, createService, logSource, or serviceName changes
  // Callbacks are accessed via refs to avoid infinite loops
  React.useEffect((): void => {
    // Use safe execution for service initialization
    safeExecuteSync(
      (): void => {
        serviceRef.current = createService(normalizedUserId);

        // Call onInitialized callback if provided (using ref to get latest version)
        if (onInitializedRef.current && serviceRef.current) {
          onInitializedRef.current(serviceRef.current, normalizedUserId);
        }
      },
      {
        logError: true,
        logSource,
        context: formatErrorContext(
          `Error initializing ${serviceName}`,
          normalizedUserId
        ),
        rethrow: false,
        defaultValue: undefined,
      }
    );

    // Call onInitializationFailed callback if initialization failed (using ref to get latest version)
    if (!serviceRef.current && onInitializationFailedRef.current) {
      onInitializationFailedRef.current();
    }
  }, [normalizedUserId, createService, logSource, serviceName]);

  return {
    serviceRef,
    normalizedUserId,
  };
}
