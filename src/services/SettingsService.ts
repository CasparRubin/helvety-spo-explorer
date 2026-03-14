import {
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  STORAGE_SCHEMA,
  STORAGE_TTL,
} from "../utils/constants";
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from "../utils/storageUtils";
import { isValidUserSettings, isPlainObject } from "../utils/validationUtils";
import {
  normalizeUserId,
  generateStorageKey,
  generateLegacyStorageKey,
  validateAndHandleInvalidInput,
} from "../utils/serviceUtils";
import { logWarning } from "../utils/errorUtils";

/**
 * User settings interface
 * Defines all available settings for the site explorer
 */
export interface IUserSettings {
  /** Show/hide full URL in the sites list */
  showFullUrl: boolean;
  /** Show/hide partial URL (path only) in the sites list */
  showPartialUrl: boolean;
  /** Show/hide site description in the sites list */
  showDescription: boolean;
  /** Open links in new tab vs current tab */
  openInNewTab: boolean;
}

interface IStoredSettingsRecord {
  schemaVersion: number;
  updatedAt: number;
  data: IUserSettings;
}

/**
 * Service for managing user settings in localStorage
 *
 * This service provides methods to get, update, and reset user preferences for the site explorer.
 * Settings are stored per user in the browser's localStorage and merged with default values
 * to ensure all properties are always present.
 *
 * Features:
 * - Per-user storage (isolated by user ID)
 * - Automatic merging with default values
 * - Partial updates supported (only update specified properties)
 * - Type-safe settings interface
 * - Graceful error handling (never throws, logs errors)
 *
 * Edge cases handled:
 * - Invalid settings: Logged and ignored (operation continues)
 * - Corrupted storage data: Validated and filtered (invalid data replaced with defaults)
 * - Partial settings: Merged with defaults (missing properties added)
 * - localStorage errors: Logged but operation continues (graceful degradation)
 * - Empty user ID: Normalized to DEFAULT_USER_ID
 *
 * @example
 * ```typescript
 * // Basic usage
 * const settingsService = new SettingsService(userId);
 * const settings = settingsService.getSettings();
 * // Returns: IUserSettings with all properties (merged with defaults if needed)
 *
 * // Update single setting
 * settingsService.updateSettings({ showFullUrl: false });
 * // Only showFullUrl is updated, other settings remain unchanged
 *
 * // Update multiple settings
 * settingsService.updateSettings({
 *   showFullUrl: true,
 *   showPartialUrl: false,
 *   openInNewTab: true
 * });
 *
 * // Read a specific setting
 * const openInNewTab = settingsService.getSettings().openInNewTab;
 *
 * // Edge case: Partial settings in storage (merged with defaults)
 * // If storage has: { showFullUrl: true }
 * // getSettings() returns: { showFullUrl: true, showPartialUrl: false, showDescription: false, openInNewTab: false }
 * // Missing properties are filled from defaults
 *
 * // Edge case: Invalid settings object (logged but ignored)
 * settingsService.updateSettings({ invalid: true } as any); // Logs warning, no error thrown
 * ```
 */
export class SettingsService {
  private userId: string;

  /**
   * Creates a new instance of SettingsService
   * @param userId - The user ID for storing user-specific settings. Falls back to DEFAULT_USER_ID if not provided.
   */
  constructor(userId: string) {
    this.userId = normalizeUserId(userId, "SettingsService");
    this.migrateLegacyStorageKeyIfPresent();
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
    const storedValue = getStorageItem<unknown>(key);

    if (this.isStoredSettingsRecord(storedValue)) {
      if (Date.now() - storedValue.updatedAt > STORAGE_TTL.SETTINGS_MS) {
        removeStorageItem(key);
        return { ...DEFAULT_SETTINGS };
      }
      if (isValidUserSettings(storedValue.data)) {
        return { ...DEFAULT_SETTINGS, ...storedValue.data };
      }
      return { ...DEFAULT_SETTINGS };
    }

    if (storedValue && isValidUserSettings(storedValue)) {
      // Legacy shape migration path (plain settings object).
      this.saveSettings(storedValue);
      return { ...DEFAULT_SETTINGS, ...storedValue };
    }

    return { ...DEFAULT_SETTINGS };
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
    // Use shared validation pattern for consistent error handling
    if (
      !validateAndHandleInvalidInput(
        isPlainObject(updates),
        "SettingsService",
        "updateSettings",
        "updates object"
      )
    ) {
      return;
    }

    const currentSettings = this.getSettings();
    const newSettings: IUserSettings = { ...currentSettings, ...updates };

    // Validate merged settings is valid
    if (
      !validateAndHandleInvalidInput(
        isValidUserSettings(newSettings),
        "SettingsService",
        "updateSettings",
        "merged settings"
      )
    ) {
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
    // Use shared validation pattern for consistent error handling
    if (
      !validateAndHandleInvalidInput(
        isValidUserSettings(settings),
        "SettingsService",
        "saveSettings",
        "settings object"
      )
    ) {
      return;
    }

    const key = this.getStorageKey();
    const record: IStoredSettingsRecord = {
      schemaVersion: STORAGE_SCHEMA.VERSION,
      updatedAt: Date.now(),
      data: settings,
    };
    setStorageItem(key, record);
  }

  private isStoredSettingsRecord(
    value: unknown
  ): value is IStoredSettingsRecord {
    if (!isPlainObject(value)) {
      return false;
    }
    const candidate = value as {
      schemaVersion?: unknown;
      updatedAt?: unknown;
      data?: unknown;
    };
    return (
      candidate.schemaVersion === STORAGE_SCHEMA.VERSION &&
      typeof candidate.updatedAt === "number" &&
      Number.isFinite(candidate.updatedAt) &&
      isValidUserSettings(candidate.data)
    );
  }

  private migrateLegacyStorageKeyIfPresent(): void {
    const key = this.getStorageKey();
    const legacyKey = generateLegacyStorageKey(
      STORAGE_KEYS.SETTINGS_PREFIX,
      this.userId
    );

    if (key === legacyKey) {
      return;
    }

    const existing = getStorageItem<unknown>(key);
    if (existing !== undefined) {
      return;
    }

    const legacyValue = getStorageItem<unknown>(legacyKey);
    if (legacyValue === undefined) {
      return;
    }

    if (isValidUserSettings(legacyValue)) {
      this.saveSettings(legacyValue);
      removeStorageItem(legacyKey);
      return;
    }

    if (this.isStoredSettingsRecord(legacyValue)) {
      setStorageItem(key, legacyValue);
      removeStorageItem(legacyKey);
      return;
    }

    removeStorageItem(legacyKey);
    logWarning(
      "SettingsService",
      "Removed invalid legacy settings storage record",
      "migrateLegacyStorageKeyIfPresent"
    );
  }
}
