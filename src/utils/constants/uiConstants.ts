/**
 * UI messages and labels
 */
import * as strings from "HelvetySpoExplorerApplicationCustomizerStrings";

/**
 * Error messages
 *
 * User-friendly error messages displayed to end users when operations fail.
 * These messages should be clear, actionable, and avoid technical jargon.
 */
export const ERROR_MESSAGES = {
  /** Generic error when fetching sites fails */
  FETCH_SITES_FAILED: strings.ErrorFetchSitesFailed,
  /** Error when user lacks permissions to fetch sites */
  FETCH_SITES_PERMISSIONS: strings.ErrorFetchSitesPermissions,
} as const;

/**
 * UI messages and labels
 */
export const UI_MESSAGES = {
  LOADING_SITES: strings.LoadingSites,
  NO_SITES_AVAILABLE: strings.NoSitesAvailable,
  NO_SITES_AVAILABLE_DESCRIPTION: strings.NoSitesAvailableDescription,
  NO_SITES_AVAILABLE_TROUBLESHOOTING: strings.NoSitesAvailableTroubleshooting,
  NO_SITES_FOUND: strings.NoSitesFound,
  SEARCH_PLACEHOLDER: strings.SearchPlaceholder,
  SEARCH_DESCRIPTION: strings.SearchDescription,
  REFRESH_SITES: strings.RefreshSites,
  SITES_YOU_HAVE_ACCESS_TO: strings.SitesYouHaveAccessTo,
  FAVORITES: strings.Favorites,
  FAVORITES_QUICK_ACCESS_MENU: strings.FavoritesQuickAccessMenu,
  ADD_TO_FAVORITES_HINT: strings.AddToFavoritesHint,
  OPEN_SITES_PANEL: strings.OpenSitesPanel,
  OPEN_SITES_PANEL_DESCRIPTION: strings.OpenSitesPanelDescription,
  CLOSE_PANEL: strings.ClosePanel,
  SITES_PANEL: strings.SitesPanel,
  SITES_TAB: strings.SitesTab,
  SETTINGS_TAB: strings.SettingsTab,
  SHOW_FULL_URL: strings.ShowFullUrl,
  SHOW_PARTIAL_URL: strings.ShowPartialUrl,
  SHOW_DESCRIPTION: strings.ShowDescription,
  ALWAYS_OPEN_NEW_TAB: strings.AlwaysOpenNewTab,
  SITE_EXPLORER_SETTINGS: strings.SiteExplorerSettings,
  REMOVE_FROM_FAVORITES: strings.RemoveFromFavorites,
  ADD_TO_FAVORITES: strings.AddToFavorites,
  OPEN_IN_NEW_TAB: strings.OpenInNewTab,
  // Settings sections
  SETTINGS_URL_DISPLAY_SECTION: strings.SettingsUrlDisplaySection,
  SETTINGS_URL_DISPLAY_DESCRIPTION: strings.SettingsUrlDisplayDescription,
  SETTINGS_SITE_INFO_SECTION: strings.SettingsSiteInfoSection,
  SETTINGS_SITE_INFO_DESCRIPTION: strings.SettingsSiteInfoDescription,
  SETTINGS_NAVIGATION_SECTION: strings.SettingsNavigationSection,
  SETTINGS_NAVIGATION_DESCRIPTION: strings.SettingsNavigationDescription,
  // About tab
  ABOUT_TAB: strings.AboutTab,
  ABOUT_APP_DESCRIPTION: strings.AboutAppDescription,
  ABOUT_CONTACT_LABEL: strings.AboutContactLabel,
  ABOUT_CONTACT_EMAIL: strings.AboutContactEmail,
  ABOUT_LINKS_LABEL: strings.AboutLinksLabel,
  ABOUT_HELVETY_LINK_LABEL: strings.AboutHelvetyLinkLabel,
  ABOUT_HELVETY_LINK_URL: strings.AboutHelvetyLinkUrl,
  ABOUT_GITHUB_LINK_LABEL: strings.AboutGithubLinkLabel,
  ABOUT_GITHUB_LINK_URL: strings.AboutGithubLinkUrl,
  ABOUT_NOT_AVAILABLE: strings.AboutNotAvailable,
  ABOUT_VERSION: strings.AboutVersion,
  ABOUT_BUILT_ON: strings.AboutBuiltOn,
  TOGGLE_ON: strings.ToggleOn,
  TOGGLE_OFF: strings.ToggleOff,
  APP_NAME: strings.AppName,
  ARIA_SETTINGS_DESCRIPTION: strings.AriaSettingsDescription,
  ARIA_ABOUT_REGION: strings.AriaAboutRegion,
  ARIA_SITE_NAVIGATION: strings.AriaSiteNavigation,
  ARIA_SITES_PANEL_DESCRIPTION: strings.AriaSitesPanelDescription,
  ARIA_SITES_PANEL_NAVIGATION: strings.AriaSitesPanelNavigation,
} as const;
