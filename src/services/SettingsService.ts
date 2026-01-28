import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../utils/constants';
import { getStorageItem, setStorageItem, removeStorageItem } from '../utils/storageUtils';
import { isValidUserSettings, isPlainObject } from '../utils/validationUtils';
import { logWarning } from '../utils/errorUtils';
import { normalizeUserId, generateStorageKey, formatValidationErrorMessage } from '../utils/serviceUtils';


/**
 * User settings interface
 * Defines all available settings for the site explorer
 */
export interface IUserSettings {
  /** Show/hide full URL in combobox dropdown */
  showFullUrl: boolean;
  /** Show/hide partial URL (path only) in combobox dropdown */
  showPartialUrl: boolean;
  /** Show/hide site description in combobox dropdown */
  showDescription: boolean;
  /** Open links in new tab vs current tab */
  openInNewTab: boolean;
}

/**
 * Service for managing user settings in localStorage
 * 
 * This service provides methods to get, update, and reset user preferences for the site explorer.
 * Settings are stored per user in the browser's localStorage and merged with default values
 * to ensure all properties are always present.
 * 
 * @example
 * ```typescript
 * const settingsService = new SettingsService(userId);
 * const settings = settingsService.getSettings();
 * settingsService.updateSettings({ showFullUrl: false });
 * ```
 */
export class SettingsService {
  private userId: string;

  /**
   * Creates a new instance of SettingsService
   * @param userId - The user ID for storing user-specific settings. Falls back to DEFAULT_USER_ID if not provided.
   */
  constructor(userId: string) {
    this.userId = normalizeUserId(userId, 'SettingsService');
  }

  /**
   * Get the storage key for the current user
   */
  private getStorageKey(): string {
    return generateStorageKey(STORAGE_KEYS.SETTINGS_PREFIX, this.userId);
  }

  /**
   * Get all user settings with defaults
   * 
   * Retrieves the user's settings from localStorage and merges them with default values
   * to ensure all properties are present. If no settings are stored, returns the default settings.
   * 
   * Handles errors from:
   * - localStorage.getItem() - may throw in restricted environments
   * - JSON.parse() - may throw if stored data is corrupted
   * 
   * Input validation:
   * - Validates stored settings is a valid user settings object
   * - Merges with defaults to ensure all properties exist
   * 
   * @returns The user's settings merged with defaults
   * @throws Never throws - returns default settings on error (localStorage/JSON errors are caught and logged)
   * 
   * @example
   * ```typescript
   * const settingsService = new SettingsService(userId);
   * const settings = settingsService.getSettings();
   * // Returns: { showFullUrl: false, showPartialUrl: false, ... }
   * ```
   */
  public getSettings(): IUserSettings {
    const key = this.getStorageKey();
    const settings = getStorageItem<IUserSettings>(key);
    
    // Validate stored settings is a valid user settings object
    if (settings && isValidUserSettings(settings)) {
      // Merge with defaults to ensure all properties exist (handles partial data)
      return { ...DEFAULT_SETTINGS, ...settings };
    }
    
    // Return defaults if no valid settings found
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * Get a specific setting value
   * 
   * Retrieves a single setting value by key. Returns the default value if the setting
   * hasn't been customized by the user.
   * 
   * @param key - The setting key to retrieve
   * @returns The value of the specified setting
   */
  public getSetting<K extends keyof IUserSettings>(key: K): IUserSettings[K] {
    const settings: IUserSettings = this.getSettings();
    return settings[key];
  }

  /**
   * Update settings (partial update supported)
   * 
   * Updates one or more settings. Only the provided properties will be updated;
   * other settings will remain unchanged. The updated settings are immediately
   * persisted to localStorage.
   * 
   * Input validation:
   * - Validates updates is a plain object
   * - Validates merged settings is a valid user settings object
   * 
   * @param updates - Partial settings object containing the properties to update
   * @throws Never throws - errors are logged but operation continues
   * 
   * @example
   * ```typescript
   * const settingsService = new SettingsService(userId);
   * settingsService.updateSettings({ showFullUrl: true });
   * // Only showFullUrl is updated, other settings remain unchanged
   * ```
   */
  public updateSettings(updates: Partial<IUserSettings>): void {
    // Validate input is a plain object
    if (!isPlainObject(updates)) {
      const errorMessage: string = formatValidationErrorMessage('updates object', 'updateSettings');
      logWarning('SettingsService', errorMessage, 'updateSettings');
      return;
    }

    const currentSettings = this.getSettings();
    const newSettings: IUserSettings = { ...currentSettings, ...updates };
    
    // Validate merged settings is valid
    if (!isValidUserSettings(newSettings)) {
      const errorMessage: string = formatValidationErrorMessage('merged settings', 'updateSettings');
      logWarning('SettingsService', errorMessage, 'updateSettings');
      return;
    }
    
    this.saveSettings(newSettings);
  }

  /**
   * Save settings to localStorage
   * 
   * Uses the shared storage utility for consistent error handling.
   * 
   * Input validation:
   * - Validates settings is a valid user settings object
   * 
   * @param settings - Settings object to save
   * @throws Never throws - errors are caught and logged by storage utility
   */
  private saveSettings(settings: IUserSettings): void {
    // Validate input
    if (!isValidUserSettings(settings)) {
      const errorMessage: string = formatValidationErrorMessage('settings object', 'saveSettings');
      logWarning('SettingsService', errorMessage, 'saveSettings');
      return;
    }

    const key = this.getStorageKey();
    setStorageItem(key, settings);
  }

  /**
   * Reset settings to defaults
   * 
   * Removes all custom settings from localStorage, effectively resetting to default values.
   */
  public resetSettings(): void {
    const key = this.getStorageKey();
    removeStorageItem(key);
  }
}
