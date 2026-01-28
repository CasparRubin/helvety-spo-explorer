import { STORAGE_KEYS } from '../utils/constants';
import { validateAndNormalizeUrl } from '../utils/urlUtils';
import { getStorageItem, setStorageItem, removeStorageItem } from '../utils/storageUtils';
import { isValidStringArray } from '../utils/validationUtils';
import { normalizeUserId, generateStorageKey, validateAndHandleInvalidInput } from '../utils/serviceUtils';


/**
 * Service for managing favorite sites in localStorage
 * 
 * This service provides methods to add, remove, toggle, and query favorite SharePoint sites.
 * Favorites are stored per user in the browser's localStorage with normalized URLs for
 * consistent comparison. URLs are normalized (lowercased, trailing slashes removed) before
 * storage and comparison.
 * 
 * Features:
 * - Per-user storage (isolated by user ID)
 * - URL normalization for consistent comparison
 * - Automatic validation of URLs before storage
 * - Graceful error handling (never throws, logs errors)
 * 
 * Edge cases handled:
 * - Invalid URLs: Logged and ignored (operation continues)
 * - Duplicate favorites: Automatically prevented (no duplicates stored)
 * - localStorage errors: Logged but operation continues (graceful degradation)
 * - Corrupted storage data: Validated and filtered (invalid entries removed)
 * - Empty user ID: Normalized to DEFAULT_USER_ID
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const favoriteService = new FavoriteService(userId);
 * favoriteService.addFavorite('https://contoso.sharepoint.com/sites/mysite');
 * const favorites = favoriteService.getFavorites();
 * 
 * // Toggle favorite status
 * const wasAdded = favoriteService.toggleFavorite('https://contoso.sharepoint.com/sites/mysite');
 * // Returns: true if added, false if removed
 * 
 * // Check if site is favorited
 * const isFavorite = favoriteService.isFavorite('https://contoso.sharepoint.com/sites/mysite');
 * 
 * // URL normalization example
 * favoriteService.addFavorite('https://contoso.sharepoint.com/sites/mysite/');
 * favoriteService.isFavorite('https://contoso.sharepoint.com/sites/mysite'); // Returns: true
 * // Trailing slash is normalized, so both URLs match
 * 
 * // Clear all favorites
 * favoriteService.clearFavorites();
 * 
 * // Edge case: Invalid URL (logged but ignored)
 * favoriteService.addFavorite('not-a-valid-url'); // Logs warning, no error thrown
 * ```
 */
export class FavoriteService {
  private userId: string;

  /**
   * Creates a new instance of FavoriteService
   * @param userId - The user ID for storing user-specific favorites. Falls back to DEFAULT_USER_ID if not provided.
   */
  constructor(userId: string) {
    this.userId = normalizeUserId(userId, 'FavoriteService');
  }

  /**
   * Get the storage key for the current user's favorites
   */
  private getStorageKey(): string {
    return generateStorageKey(STORAGE_KEYS.FAVORITES_PREFIX, this.userId);
  }

  /**
   * Get all favorite site URLs for the current user
   * 
   * Retrieves the list of favorite site URLs from localStorage. Returns an empty array
   * if no favorites are stored or if an error occurs during retrieval.
   * 
   * Handles errors from:
   * - localStorage.getItem() - may throw in restricted environments
   * - JSON.parse() - may throw if stored data is corrupted
   * 
   * Input validation:
   * - Validates stored data is a valid string array
   * - Filters out invalid entries (non-strings)
   * 
   * @returns Array of favorite site URLs (normalized, lowercase)
   * @throws Never throws - returns empty array on error (localStorage/JSON errors are caught and logged)
   * 
   * @example
   * ```typescript
   * const favoriteService = new FavoriteService(userId);
   * const favorites = favoriteService.getFavorites();
   * // Returns: ['https://contoso.sharepoint.com/sites/mysite', ...]
   * ```
   */
  public getFavorites(): string[] {
    const key = this.getStorageKey();
    const favorites = getStorageItem<string[]>(key);
    
    // Validate stored data is a valid string array
    if (!isValidStringArray(favorites)) {
      return [];
    }
    
    // Filter out any invalid entries (shouldn't happen, but defensive check)
    return favorites.filter((url: string): boolean => typeof url === 'string' && url.length > 0);
  }

  /**
   * Add a site URL to favorites
   * 
   * Adds the specified URL to the user's favorites list if it's not already present.
   * The URL is normalized before storage (lowercased, trailing slash removed).
   * 
   * Input validation:
   * - Validates url is a non-empty string
   * - Validates normalized URL is valid
   * 
   * @param url - The site URL to add to favorites
   * @throws Never throws - errors are logged but operation continues
   * 
   * @example
   * ```typescript
   * const favoriteService = new FavoriteService(userId);
   * favoriteService.addFavorite('https://contoso.sharepoint.com/sites/mysite');
   * ```
   */
  public addFavorite(url: string): void {
    const validationResult = validateAndNormalizeUrl(url);
    
    // Use shared validation pattern for consistent error handling
    if (!validateAndHandleInvalidInput(validationResult.isValid, 'FavoriteService', 'addFavorite', 'URL', url)) {
      return;
    }

    const favorites = this.getFavorites();
    const normalizedUrl = validationResult.normalizedUrl;
    
    // Check if already favorited
    // Use indexOf for ES5 compatibility (SPFx targets ES5)
    if (favorites.indexOf(normalizedUrl) === -1) {
      favorites.push(normalizedUrl);
      this.saveFavorites(favorites);
    }
  }

  /**
   * Remove a site URL from favorites
   * 
   * Removes the specified URL from the user's favorites list if it exists.
   * The URL is normalized before comparison.
   * 
   * Input validation:
   * - Validates url is a non-empty string
   * 
   * @param url - The site URL to remove from favorites
   * @throws Never throws - errors are logged but operation continues
   */
  public removeFavorite(url: string): void {
    const validationResult = validateAndNormalizeUrl(url);
    
    // Use shared validation pattern for consistent error handling
    if (!validateAndHandleInvalidInput(validationResult.isValid, 'FavoriteService', 'removeFavorite', 'URL', url)) {
      return;
    }

    const favorites = this.getFavorites();
    const normalizedUrl = validationResult.normalizedUrl;
    
    const filtered = favorites.filter((fav: string): boolean => fav !== normalizedUrl);
    
    if (filtered.length !== favorites.length) {
      this.saveFavorites(filtered);
    }
  }

  /**
   * Toggle favorite status of a site URL
   * 
   * If the URL is currently favorited, it will be removed. If it's not favorited,
   * it will be added. The URL is normalized before comparison and storage.
   * 
   * @param url - The site URL to toggle favorite status for
   * @returns true if the site was added to favorites, false if it was removed or on error
   * @throws Never throws - returns false on error (errors are logged but operation continues)
   * 
   * @example
   * ```typescript
   * const favoriteService = new FavoriteService(userId);
   * const wasAdded = favoriteService.toggleFavorite('https://contoso.sharepoint.com/sites/mysite');
   * // Returns: true if added, false if removed
   * ```
   */
  public toggleFavorite(url: string): boolean {
    const validationResult = validateAndNormalizeUrl(url);
    
    if (!validationResult.isValid) {
      return false;
    }

    const normalizedUrl = validationResult.normalizedUrl;
    const isCurrentlyFavorite = this.isFavorite(normalizedUrl);
    
    if (isCurrentlyFavorite) {
      this.removeFavorite(normalizedUrl);
      return false;
    } else {
      this.addFavorite(normalizedUrl);
      return true;
    }
  }

  /**
   * Check if a site URL is favorited
   * 
   * Checks whether the specified URL exists in the user's favorites list.
   * The URL is normalized before comparison.
   * 
   * @param url - The site URL to check
   * @returns true if the site is favorited, false otherwise
   */
  public isFavorite(url: string): boolean {
    const validationResult = validateAndNormalizeUrl(url);
    
    if (!validationResult.isValid) {
      return false;
    }

    const favorites = this.getFavorites();
    const normalizedUrl = validationResult.normalizedUrl;
    // Use indexOf for ES5 compatibility (SPFx targets ES5)
    return favorites.indexOf(normalizedUrl) !== -1;
  }

  /**
   * Clear all favorites for the current user
   * 
   * Removes all favorite sites from localStorage for the current user.
   */
  public clearFavorites(): void {
    const key = this.getStorageKey();
    removeStorageItem(key);
  }

  /**
   * Save favorites to localStorage
   * 
   * Uses the shared storage utility for consistent error handling.
   * 
   * Input validation:
   * - Validates favorites is a valid string array
   * 
   * @param favorites - Array of favorite URLs to save
   * @throws Never throws - errors are caught and logged by storage utility
   */
  private saveFavorites(favorites: string[]): void {
    // Use shared validation pattern for consistent error handling
    if (!validateAndHandleInvalidInput(isValidStringArray(favorites), 'FavoriteService', 'saveFavorites', 'favorites array')) {
      return;
    }

    const key = this.getStorageKey();
    setStorageItem(key, favorites);
  }
}
