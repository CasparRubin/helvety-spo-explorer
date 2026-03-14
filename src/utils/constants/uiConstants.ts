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
  FETCH_SITES_FAILED: "Failed to fetch sites",
  /** Error when user lacks permissions to fetch sites */
  FETCH_SITES_PERMISSIONS:
    "Unable to fetch sites. Please check your permissions and try again.",
} as const;

/**
 * UI messages and labels
 */
export const UI_MESSAGES = {
  LOADING_SITES: "Loading sites...",
  NO_SITES_AVAILABLE: "No sites available",
  NO_SITES_AVAILABLE_DESCRIPTION:
    "No SharePoint sites were found. This could mean no matching sites are currently available via search, or there was an issue loading them.",
  NO_SITES_AVAILABLE_TROUBLESHOOTING:
    "Try refreshing the list, or check with your administrator if you should have access to sites.",
  NO_SITES_FOUND: "No sites found matching",
  SEARCH_PLACEHOLDER: "Search sites...",
  SEARCH_DESCRIPTION: "Search sites by title, description, or URL",
  REFRESH_SITES: "Refresh sites",
  SITES_YOU_HAVE_ACCESS_TO: "Sites available to you",
  FAVORITES: "Favorites",
  FAVORITES_QUICK_ACCESS_MENU: "Favorites quick access menu",
  ADD_TO_FAVORITES_HINT: "Add sites to favorites for quick access",
  OPEN_SITES_PANEL: "Open sites panel",
  OPEN_SITES_PANEL_DESCRIPTION:
    "Opens the Sites panel to browse and search SharePoint sites. Use the split-button menu for quick access to favorite sites.",
  CLOSE_PANEL: "Close sites panel",
  SITES_PANEL: "Sites panel",
  SITES_TAB: "Sites",
  SETTINGS_TAB: "Settings",
  SHOW_FULL_URL: "Show Full URL",
  SHOW_PARTIAL_URL: "Show Partial URL",
  SHOW_DESCRIPTION: "Show Description",
  ALWAYS_OPEN_NEW_TAB: "Always open in new tab",
  SITE_EXPLORER_SETTINGS: "Site explorer settings",
  REMOVE_FROM_FAVORITES: "Remove from favorites",
  ADD_TO_FAVORITES: "Add to favorites",
  OPEN_IN_NEW_TAB: "Open in new tab",
  // Settings sections
  SETTINGS_URL_DISPLAY_SECTION: "URL Display",
  SETTINGS_URL_DISPLAY_DESCRIPTION:
    "Choose how site URLs are displayed in the sites list. Full URL shows the complete address, while Partial URL shows only the path.",
  SETTINGS_SITE_INFO_SECTION: "Site Information",
  SETTINGS_SITE_INFO_DESCRIPTION:
    "Control which additional information is shown for each site in the list.",
  SETTINGS_NAVIGATION_SECTION: "Navigation",
  SETTINGS_NAVIGATION_DESCRIPTION:
    "Configure how site links behave when clicked.",
  // About tab
  ABOUT_TAB: "About",
  ABOUT_APP_DESCRIPTION:
    "Helvety SPO Explorer provides a navigation panel for SharePoint Online with site search, favorites, and customizable settings.",
  ABOUT_CONTACT_LABEL: "Contact",
  ABOUT_CONTACT_EMAIL: "contact@helvety.com",
  ABOUT_NOT_AVAILABLE: "—",
  ABOUT_VERSION: "Version",
  ABOUT_BUILT_ON: "Built on",
} as const;
