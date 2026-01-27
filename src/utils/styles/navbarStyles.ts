import { CSS_VARIABLES, LAYOUT, Z_INDEX } from '../constants';

/**
 * Navbar component styles
 */

/**
 * Navbar container styles
 */
export const navbarStyles: React.CSSProperties = {
  backgroundColor: CSS_VARIABLES.BACKGROUND,
  borderBottom: '0',
  borderBottomWidth: '0',
  borderBottomStyle: 'none',
  borderBottomColor: 'transparent',
  padding: LAYOUT.NAVBAR_PADDING,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  height: LAYOUT.NAVBAR_HEIGHT,
  zIndex: Z_INDEX.NAVBAR,
  width: '100%',
  boxSizing: 'border-box', // Include padding in width calculation
  overflow: 'hidden', // Prevent content from overflowing
} as const;

/**
 * Navbar inner container styles
 */
export const navbarInnerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: LAYOUT.NAVBAR_GAP,
  width: '100%',
  minWidth: 0, // Allow flex container to shrink
  boxSizing: 'border-box', // Include padding in width calculation
} as const;

/**
 * Navbar content area styles
 */
export const navbarContentStyles: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: LAYOUT.COMBOBOX_GAP,
  minWidth: 0, // Allow flex item to shrink below content size
  overflow: 'hidden', // Prevent overflow
} as const;

/**
 * Settings button container styles
 */
export const settingsButtonContainerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
} as const;

/**
 * Settings button styles
 */
export const settingsButtonStyles = {
  root: {
    color: CSS_VARIABLES.NEUTRAL_PRIMARY,
  },
  rootHovered: {
    backgroundColor: CSS_VARIABLES.BACKGROUND_HOVER,
  },
} as const;

/**
 * ComboBox styles
 */
export const comboBoxStyles = {
  root: {
    width: '100%',
    minWidth: 0, // Allow combobox to shrink, will be constrained by parent
    maxWidth: '100%', // Prevent overflow
  },
  callout: {
    maxHeight: LAYOUT.DROPDOWN_MAX_HEIGHT,
  },
} as const;

/**
 * Button styles for "Sites you have access to" split button
 * Minimal overrides to match SharePoint theme while preserving Fluent UI defaults
 */
export const sitesButtonStyles = {
  root: {
    color: CSS_VARIABLES.NEUTRAL_PRIMARY,
    backgroundColor: 'transparent',
  },
  rootHovered: {
    backgroundColor: CSS_VARIABLES.BACKGROUND_HOVER,
    color: CSS_VARIABLES.NEUTRAL_PRIMARY,
  },
  rootPressed: {
    backgroundColor: CSS_VARIABLES.BACKGROUND_HOVER,
    color: CSS_VARIABLES.NEUTRAL_PRIMARY,
  },
} as const;
