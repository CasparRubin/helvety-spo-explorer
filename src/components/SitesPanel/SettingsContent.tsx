// External dependencies
import * as React from "react";
import { Toggle } from '@fluentui/react/lib/Toggle';

// Types
import { IUserSettings } from "../../services/SettingsService";

// Constants
import { UI_MESSAGES } from '../../utils/constants';

// Styles
import { 
  settingsPanelContentStyles, 
  settingsToggleStyles, 
  srOnlyStyles,
  settingsSectionStyles,
  settingsSectionHeaderStyles,
  settingsSectionDescriptionStyles,
} from '../../utils/styles';

/**
 * Props for the SettingsContent component
 * 
 * @interface ISettingsContentProps
 */
interface ISettingsContentProps {
  /** Current user settings to display */
  settings: IUserSettings;
  /** Callback function invoked when settings are changed */
  onSettingsChange: (settings: IUserSettings) => void;
}

/**
 * SettingsContent component - displays settings toggles
 * 
 * This component renders a form with toggle switches for user preferences:
 * - Show Full URL: Toggle visibility of full site URLs in the sites list
 * - Show Partial URL: Toggle visibility of partial site URLs (path only) in the sites list
 * - Show Description: Toggle visibility of site descriptions in the sites list
 * - Always open in new tab: Toggle whether site links open in new tabs
 * 
 * Note: Show Full URL and Show Partial URL are mutually exclusive - enabling one disables the other.
 * Both can be disabled at the same time.
 * 
 * The component is memoized for performance optimization and automatically persists
 * settings to localStorage via the SettingsService.
 * 
 * @component
 * @param props - Component props containing current settings and change handler
 * 
 * @example
 * ```tsx
 * <SettingsContent
 *   settings={userSettings}
 *   onSettingsChange={handleSettingsChange}
 * />
 * ```
 */
export const SettingsContent: React.FC<ISettingsContentProps> = React.memo(({
  settings,
  onSettingsChange,
}) => {
  /**
   * Handles toggle change events for settings
   * 
   * Creates a handler function for a specific setting key that:
   * - Updates the setting value when toggled
   * - Enforces mutual exclusivity between showFullUrl and showPartialUrl
   * - Calls the parent's onSettingsChange callback with updated settings
   * 
   * @param key - The setting key to create a handler for
   * @returns Event handler function for the toggle component
   */
  const handleToggleChange = React.useCallback(
    (key: keyof IUserSettings) => (_ev: React.MouseEvent<HTMLElement>, checked?: boolean): void => {
      if (checked !== undefined) {
        const updatedSettings: IUserSettings = {
          ...settings,
          [key]: checked,
        };
        
        // Enforce mutual exclusivity for URL display settings
        // When one URL display option is enabled, disable the other
        if (key === 'showPartialUrl' && checked) {
          updatedSettings.showFullUrl = false;
        } else if (key === 'showFullUrl' && checked) {
          updatedSettings.showPartialUrl = false;
        }
        
        onSettingsChange(updatedSettings);
      }
    },
    [settings, onSettingsChange]
  );

  return (
    <div 
      style={settingsPanelContentStyles} 
      role="region" 
      aria-label="Site explorer settings"
      aria-describedby="settings-description"
    >
      <span id="settings-description" style={srOnlyStyles}>
        Customize display options for the site explorer, including URL visibility and link behavior
      </span>
      
      {/* URL Display Section */}
      <section 
        style={settingsSectionStyles}
        aria-labelledby="url-display-section-header"
        aria-describedby="url-display-section-description"
      >
        <h3 id="url-display-section-header" style={settingsSectionHeaderStyles}>
          {UI_MESSAGES.SETTINGS_URL_DISPLAY_SECTION}
        </h3>
        <p id="url-display-section-description" style={settingsSectionDescriptionStyles}>
          {UI_MESSAGES.SETTINGS_URL_DISPLAY_DESCRIPTION}
        </p>
        <Toggle
          label={UI_MESSAGES.SHOW_FULL_URL}
          checked={settings.showFullUrl}
          onChange={handleToggleChange('showFullUrl')}
          onText="On"
          offText="Off"
          styles={settingsToggleStyles}
        />
        <Toggle
          label={UI_MESSAGES.SHOW_PARTIAL_URL}
          checked={settings.showPartialUrl}
          onChange={handleToggleChange('showPartialUrl')}
          onText="On"
          offText="Off"
          styles={settingsToggleStyles}
        />
      </section>

      {/* Site Information Section */}
      <section 
        style={settingsSectionStyles}
        aria-labelledby="site-info-section-header"
        aria-describedby="site-info-section-description"
      >
        <h3 id="site-info-section-header" style={settingsSectionHeaderStyles}>
          {UI_MESSAGES.SETTINGS_SITE_INFO_SECTION}
        </h3>
        <p id="site-info-section-description" style={settingsSectionDescriptionStyles}>
          {UI_MESSAGES.SETTINGS_SITE_INFO_DESCRIPTION}
        </p>
        <Toggle
          label={UI_MESSAGES.SHOW_DESCRIPTION}
          checked={settings.showDescription}
          onChange={handleToggleChange('showDescription')}
          onText="On"
          offText="Off"
          styles={settingsToggleStyles}
        />
      </section>

      {/* Navigation Section */}
      <section 
        style={{
          ...settingsSectionStyles,
          borderBottom: 'none', // Remove border from last section
          marginBottom: 0,
          paddingBottom: 0,
        }}
        aria-labelledby="navigation-section-header"
        aria-describedby="navigation-section-description"
      >
        <h3 id="navigation-section-header" style={settingsSectionHeaderStyles}>
          {UI_MESSAGES.SETTINGS_NAVIGATION_SECTION}
        </h3>
        <p id="navigation-section-description" style={settingsSectionDescriptionStyles}>
          {UI_MESSAGES.SETTINGS_NAVIGATION_DESCRIPTION}
        </p>
        <Toggle
          label={UI_MESSAGES.ALWAYS_OPEN_NEW_TAB}
          checked={settings.openInNewTab}
          onChange={handleToggleChange('openInNewTab')}
          onText="On"
          offText="Off"
          styles={settingsToggleStyles}
        />
      </section>
    </div>
  );
});

SettingsContent.displayName = 'SettingsContent';
