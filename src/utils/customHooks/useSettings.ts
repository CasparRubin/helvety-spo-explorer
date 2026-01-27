import * as React from 'react';
import { SettingsService, IUserSettings } from '../../services/SettingsService';
import { DEFAULT_SETTINGS, DEFAULT_USER_ID } from '../constants';
import { shallowEqual } from '../componentUtils';
import { logError } from '../errorUtils';

const LOG_SOURCE = 'useSettings';

/**
 * Return type for useSettings hook
 */
export interface IUseSettingsReturn {
  /** Current user settings */
  settings: IUserSettings;
  /** Function to update settings */
  updateSettings: (newSettings: IUserSettings) => void;
}

/**
 * Custom hook for managing user settings
 * 
 * This hook encapsulates all settings-related logic including:
 * - Loading settings from storage
 * - Updating settings
 * - Persisting settings to storage
 * 
 * @param userId - User ID for storing user-specific settings
 * @returns Object containing settings and update handler
 * 
 * @example
 * ```typescript
 * const { settings, updateSettings } = useSettings(userId);
 * updateSettings({ showFullUrl: true });
 * ```
 */
export function useSettings(userId: string): IUseSettingsReturn {
  const [settings, setSettings] = React.useState<IUserSettings>({ ...DEFAULT_SETTINGS });
  const settingsServiceRef = React.useRef<SettingsService | null>(null);

  // Initialize settings service
  React.useEffect((): void => {
    try {
      const normalizedUserId: string = userId || DEFAULT_USER_ID;
      settingsServiceRef.current = new SettingsService(normalizedUserId);
      
      // Load settings with error handling
      try {
        const userSettings: IUserSettings = settingsServiceRef.current.getSettings();
        // Only update state if settings have actually changed
        // Use functional update to compare with previous state and prevent unnecessary re-renders
        setSettings((prevSettings: IUserSettings): IUserSettings => {
          // Fast path: same reference means no change
          if (prevSettings === userSettings) {
            return prevSettings;
          }
          
          // Deep comparison using shallowEqual (settings object is shallow)
          if (shallowEqual(prevSettings, userSettings)) {
            return prevSettings; // Return previous state to prevent re-render
          }
          return userSettings;
        });
      } catch (loadError: unknown) {
        logError(LOG_SOURCE, loadError, `Error loading settings for user: ${normalizedUserId}`);
        // Use default settings as fallback
        setSettings({ ...DEFAULT_SETTINGS });
      }
    } catch (initError: unknown) {
      logError(LOG_SOURCE, initError, `Error initializing SettingsService for user: ${userId || DEFAULT_USER_ID}`);
      // Use default settings as fallback
      setSettings({ ...DEFAULT_SETTINGS });
    }
  }, [userId]);

  // Update settings function
  const updateSettings = React.useCallback((newSettings: IUserSettings): void => {
    if (!newSettings || typeof newSettings !== 'object') {
      logError(LOG_SOURCE, new Error('Invalid settings object provided'), 'Cannot update settings - invalid settings object');
      return;
    }

    const settingsService: SettingsService | null = settingsServiceRef.current;
    if (!settingsService) {
      logError(LOG_SOURCE, new Error('SettingsService not initialized'), 'Cannot update settings - service not available');
      return;
    }

    // Only update state if settings have actually changed
    // Use functional update to compare with previous state and prevent unnecessary re-renders
    setSettings((prevSettings: IUserSettings): IUserSettings => {
      // Fast path: same reference means no change
      if (prevSettings === newSettings) {
        return prevSettings;
      }
      
      // Deep comparison using shallowEqual (settings object is shallow)
      if (shallowEqual(prevSettings, newSettings)) {
        return prevSettings; // Return previous state to prevent re-render
      }
      
      // Persist to storage with error handling
      try {
        settingsService.updateSettings(newSettings);
      } catch (saveError: unknown) {
        logError(LOG_SOURCE, saveError, 'Error saving settings to storage');
        // Still update local state even if storage save fails
        // This ensures UI reflects user's choice even if persistence fails
      }
      
      return newSettings;
    });
  }, []);

  return {
    settings,
    updateSettings,
  };
}
