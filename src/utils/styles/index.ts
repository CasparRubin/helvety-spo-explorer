/**
 * Style exports
 * 
 * Centralized export point for all style modules.
 * Import styles from this file to maintain clean imports.
 */

import * as React from 'react';

// Common styles
export {
  optionContainerStyles,
  siteInfoStyles,
  siteTitleStyles,
  siteDescriptionStyles,
  siteUrlStyles,
  followIconContainerStyles,
  followingHeaderStyles,
  dividerStyles,
  emptyStateStyles,
  loadingContainerStyles,
  emptySitesStyles,
  srOnlyStyles,
} from './commonStyles';

// Navbar styles
export {
  navbarStyles,
  navbarInnerStyles,
  navbarContentStyles,
  settingsButtonContainerStyles,
  settingsButtonStyles,
  comboBoxStyles,
  sitesButtonStyles,
} from './navbarStyles';

// Panel styles
export {
  settingsPanelContentStyles,
  settingsToggleStyles,
  settingsToggleDescriptionStyles,
  pivotStyles,
  tabDescriptionStyles,
  pivotItemContentStyles,
  settingsSectionStyles,
  settingsSectionHeaderStyles,
  settingsSectionDescriptionStyles,
} from './panelStyles';

// Sites list styles
export {
  sitesListContainerStyles,
  searchInputStyles,
  sitesListStyles,
  scrollableContainerStyles,
  siteItemStyles,
  bottomFadeOverlayStyles,
  scrollableContainerWrapperStyles,
  getSiteItemHoverStyles,
  getSiteUrlStyles,
  getActionButtonsContainerStyles,
  getActionButtonHoverStyles,
  searchContainerStyles,
  separatorContainerStyles,
  refreshButtonStyles,
} from './sitesStyles';

/**
 * Style for highlighted text in search results
 */
export const highlightMarkStyle: React.CSSProperties = {
  backgroundColor: 'var(--sp-color-themePrimary)',
  color: 'var(--sp-color-white)',
  padding: '2px 0',
  borderRadius: '2px',
};
