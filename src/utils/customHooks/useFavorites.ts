import * as React from 'react';
import { FavoriteService } from '../../services/FavoriteService';
import { logError } from '../errorUtils';
import { isValidStringArray, isNonEmptyString } from '../validationUtils';
import { safeExecuteSync } from '../errorHandlingUtils';
import { useServiceInitialization } from './useServiceInitialization';

const LOG_SOURCE = 'useFavorites';

/**
 * Return type for useFavorites hook
 */
export interface IUseFavoritesReturn {
  /** Set of favorite site URLs */
  favoriteSites: Set<string>;
  /** Function to toggle favorite status of a site */
  toggleFavorite: (siteUrl: string) => void;
  /** Function to refresh favorites from storage */
  refreshFavorites: () => void;
}

/**
 * Custom hook for managing favorite sites
 * 
 * This hook encapsulates all favorite-related logic including:
 * - Loading favorites from storage
 * - Toggling favorite status
 * - Refreshing favorites list
 * 
 * @param userId - User ID for storing user-specific favorites
 * @returns Object containing favoriteSites set and handlers
 * 
 * @example
 * ```typescript
 * const { favoriteSites, toggleFavorite, refreshFavorites } = useFavorites(userId);
 * ```
 */
export function useFavorites(userId: string): IUseFavoritesReturn {
  const [favoriteSites, setFavoriteSites] = React.useState<Set<string>>(new Set());

  // Initialize favorite service using reusable hook
  const { serviceRef: favoriteServiceRef } = useServiceInitialization<FavoriteService>({
    createService: (normalizedUserId: string): FavoriteService => {
      return new FavoriteService(normalizedUserId);
    },
    userId,
    logSource: LOG_SOURCE,
    serviceName: 'FavoriteService',
    onInitialized: (service: FavoriteService): void => {
      // Load favorite sites with error handling
      const favoriteUrls: string[] = service.getFavorites();
      
      // Validate favorite URLs array before creating Set
      if (isValidStringArray(favoriteUrls)) {
        setFavoriteSites(new Set(favoriteUrls));
      } else {
        // Set empty set if validation fails
        setFavoriteSites(new Set());
      }
    },
    onInitializationFailed: (): void => {
      // Set empty set as fallback if initialization failed
      setFavoriteSites(new Set());
    },
  });

  // Refresh favorite sites list
  const refreshFavorites = React.useCallback((): void => {
    if (!favoriteServiceRef.current) {
      logError(LOG_SOURCE, new Error('FavoriteService not initialized'), 'Cannot refresh favorites - service not available');
      return;
    }

    try {
      const favoriteUrls: string[] = favoriteServiceRef.current.getFavorites();
      const newFavoriteSet = new Set(favoriteUrls);
      
      // Only update state if favorites actually changed
      // Use functional update to compare with previous state and prevent unnecessary re-renders
      setFavoriteSites((prevFavorites: Set<string>): Set<string> => {
        // Fast path: same reference means no change
        if (prevFavorites === newFavoriteSet) {
          return prevFavorites;
        }
        
        // Quick check: if sizes differ, favorites changed
        if (prevFavorites.size !== newFavoriteSet.size) {
          return newFavoriteSet;
        }
        
        // If sizes are same, check if content is different
        // Use Array.from for ES5 compatibility (SPFx targets ES5)
        // Check if any item in new set is missing from previous set
        const newFavoriteArray = Array.from(newFavoriteSet);
        for (let i = 0; i < newFavoriteArray.length; i++) {
          const url = newFavoriteArray[i];
          if (!prevFavorites.has(url)) {
            return newFavoriteSet;
          }
        }
        
        // No changes detected, return previous Set to prevent re-render
        return prevFavorites;
      });
    } catch (err: unknown) {
      logError(LOG_SOURCE, err, 'Error refreshing favorite sites');
      // Keep current state on error to prevent UI flicker
      // Don't reset to empty set as that would lose user's current view
    }
  }, []);

  // Toggle favorite status
  const toggleFavorite = React.useCallback((siteUrl: string): void => {
    // Validate input using validation utility
    if (!isNonEmptyString(siteUrl)) {
      logError(LOG_SOURCE, new Error('Invalid site URL provided'), `Cannot toggle favorite - invalid URL: ${siteUrl}`);
      return;
    }

    if (!favoriteServiceRef.current) {
      logError(LOG_SOURCE, new Error('FavoriteService not initialized'), 'Cannot toggle favorite - service not available');
      return;
    }

    // Use safe execution for consistent error handling
    safeExecuteSync(
      (): void => {
        favoriteServiceRef.current!.toggleFavorite(siteUrl);
        // Refresh favorite sites list to reflect the change
        refreshFavorites();
      },
      {
        logError: true,
        logSource: LOG_SOURCE,
        context: `Error toggling favorite for site: ${siteUrl}`,
        rethrow: false,
      }
    );
  }, [refreshFavorites]);

  return {
    favoriteSites,
    toggleFavorite,
    refreshFavorites,
  };
}
