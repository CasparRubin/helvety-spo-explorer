import * as React from 'react';
import { SettingsService, IUserSettings } from '../../services/SettingsService';
import { DEFAULT_SETTINGS } from '../constants';
import { shallowEqual } from '../componentUtils';
import { logError } from '../errorUtils';
import { isValidUserSettings, isPlainObject } from '../validationUtils';
import { safeExecuteSync } from '../errorHandlingUtils';
import { useServiceInitialization } from './useServiceInitialization';

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

  // Initialize settings service using reusable hook
  const { serviceRef: settingsServiceRef } = useServiceInitialization<SettingsService>({
    createService: (normalizedUserId: string): SettingsService => {
      return new SettingsService(normalizedUserId);
    },
    userId,
    logSource: LOG_SOURCE,
    serviceName: 'SettingsService',
    onInitialized: (service: SettingsService): void => {
      // Load settings with error handling
      const userSettings: IUserSettings = service.getSettings();
      
      // Validate loaded settings before updating state
      if (!isValidUserSettings(userSettings)) {
        logError(LOG_SOURCE, new Error('Invalid settings loaded from storage'), `User: ${userId}`);
        setSettings({ ...DEFAULT_SETTINGS });
        return;
      }
      
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
    },
    onInitializationFailed: (): void => {
      // Use default settings as fallback if initialization failed
      setSettings({ ...DEFAULT_SETTINGS });
    },
  });

  // Update settings function
  const updateSettings = React.useCallback((newSettings: IUserSettings): void => {
    // Validate input using validation utilities
    if (!isPlainObject(newSettings) || !isValidUserSettings(newSettings)) {
      logError(LOG_SOURCE, new Error('Invalid settings object provided'), 'Cannot update settings - invalid settings object');
      return;
    }

    const settingsService: SettingsService | undefined = settingsServiceRef.current;
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
      
      // Persist to storage with error handling using safe execution
      safeExecuteSync(
        (): void => {
          settingsService.updateSettings(newSettings);
        },
        {
          logError: true,
          logSource: LOG_SOURCE,
          context: 'Error saving settings to storage',
          rethrow: false,
        }
      );
      
      // Still update local state even if storage save fails
      // This ensures UI reflects user's choice even if persistence fails
      return newSettings;
    });
  }, []);

  return {
    settings,
    updateSettings,
  };
}
