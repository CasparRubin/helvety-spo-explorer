/**
 * UI messages and labels
 */

/**
 * Error messages
 * 
 * User-friendly error messages displayed to end users when operations fail.
 * These messages should be clear, actionable, and avoid technical jargon.
 */
export const ERROR_MESSAGES = {
  /** Generic error when fetching sites fails */
  FETCH_SITES_FAILED: 'Failed to fetch sites',
  /** Error when user lacks permissions to fetch sites */
  FETCH_SITES_PERMISSIONS: 'Unable to fetch sites. Please check your permissions and try again.',
  /** Error when parsing an error response fails */
  PARSE_ERROR_RESPONSE: 'Failed to parse error response',
  /** Warning when search API fails and falling back to WebInfos API */
  SEARCH_API_FAILED: 'Search API failed, trying webinfos',
  /** Error when both API methods fail */
  BOTH_APIS_FAILED: 'Failed to fetch sites from both APIs',
} as const;

/**
 * UI messages and labels
 */
export const UI_MESSAGES = {
  LOADING_SITES: 'Loading sites...',
  NO_SITES_AVAILABLE: 'No sites available',
  NO_SITES_AVAILABLE_DESCRIPTION: 'No SharePoint sites were found. This could mean you don\'t have access to any sites, or there was an issue loading them.',
  NO_SITES_AVAILABLE_TROUBLESHOOTING: 'Try refreshing the list, or check with your administrator if you should have access to sites.',
  NO_SITES_FOUND: 'No sites found matching',
  SEARCH_PLACEHOLDER: 'Search sites...',
  SEARCH_DESCRIPTION: 'Search sites by title, description, or URL',
  REFRESH_SITES: 'Refresh sites',
  SITES_YOU_HAVE_ACCESS_TO: 'Sites you have access to',
  FAVORITES: 'Favorites',
  FAVORITES_QUICK_ACCESS_MENU: 'Favorites quick access menu',
  ADD_TO_FAVORITES_HINT: 'Add sites to favorites for quick access',
  OPEN_SITES_PANEL: 'Open sites panel',
  OPEN_SITES_PANEL_DESCRIPTION: 'Opens a panel showing all SharePoint sites you have access to. Use the dropdown for quick access to main page and favorite sites.',
  CLOSE_PANEL: 'Close sites panel',
  SITES_PANEL: 'Sites panel',
  SITES_TAB: 'Sites',
  SETTINGS_TAB: 'Settings',
  SETTINGS_DESCRIPTION: 'Customize your site explorer preferences',
  SITES_DESCRIPTION: 'Browse and search through all SharePoint Online sites you have access to',
  SHOW_FULL_URL: 'Show Full URL',
  SHOW_PARTIAL_URL: 'Show Partial URL',
  SHOW_DESCRIPTION: 'Show Description',
  ALWAYS_OPEN_NEW_TAB: 'Always open in new tab',
  SITE_EXPLORER_SETTINGS: 'Site explorer settings',
  REMOVE_FROM_FAVORITES: 'Remove from favorites',
  ADD_TO_FAVORITES: 'Add to favorites',
  OPEN_IN_NEW_TAB: 'Open in new tab',
  // Settings sections
  SETTINGS_URL_DISPLAY_SECTION: 'URL Display',
  SETTINGS_URL_DISPLAY_DESCRIPTION: 'Choose how site URLs are displayed in the sites list. Full URL shows the complete address, while Partial URL shows only the path.',
  SETTINGS_SITE_INFO_SECTION: 'Site Information',
  SETTINGS_SITE_INFO_DESCRIPTION: 'Control which additional information is shown for each site in the list.',
  SETTINGS_NAVIGATION_SECTION: 'Navigation',
  SETTINGS_NAVIGATION_DESCRIPTION: 'Configure how site links behave when clicked.',
} as const;
