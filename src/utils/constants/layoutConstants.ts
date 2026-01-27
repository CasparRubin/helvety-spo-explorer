/**
 * Layout, spacing, typography, and visual design constants
 */

/**
 * CSS variable names for SharePoint theming
 * These variables automatically adapt to light and dark themes
 * SharePoint provides these variables based on the current theme context
 */
export const CSS_VARIABLES = {
  NEUTRAL_1: 'var(--sp-color-neutral-1)',
  NEUTRAL_2: 'var(--sp-color-neutral-2)',
  NEUTRAL_5: 'var(--sp-color-neutral-5)',
  NEUTRAL_6: 'var(--sp-color-neutral-6)',
  NEUTRAL_10: 'var(--sp-color-neutral-10)',
  THEME_LIGHT: 'var(--sp-color-themeLight)',
  THEME_PRIMARY: 'var(--sp-color-themePrimary)',
  YELLOW: 'var(--sp-color-yellow)',
  // Additional theme-aware colors for better dark mode support
  NEUTRAL_PRIMARY: 'var(--sp-color-neutralForeground1)',
  NEUTRAL_SECONDARY: 'var(--sp-color-neutralForeground2)',
  NEUTRAL_TERTIARY: 'var(--sp-color-neutralForeground3)',
  BACKGROUND: 'var(--sp-color-neutralBackground1)',
  BACKGROUND_HOVER: 'var(--sp-color-neutralBackground2)',
  // Enhanced hover states for better visibility
  BACKGROUND_HOVER_STRONG: 'var(--sp-color-neutralBackground3)',
  BORDER_HOVER: 'var(--sp-color-neutral-3)',
  ACTION_BUTTON_HOVER: 'var(--sp-color-neutralBackground3)',
} as const;

/**
 * Component dimensions and spacing
 */
export const LAYOUT = {
  NAVBAR_HEIGHT: '48px',
  NAVBAR_PADDING: '0 16px',
  NAVBAR_GAP: '16px',
  COMBOBOX_GAP: '8px',
  COMBOBOX_MIN_WIDTH: '600px',
  DROPDOWN_MAX_HEIGHT: '400px',
  DROPDOWN_WIDTH: 500,
  OPTION_PADDING: '8px 12px',
  OPTION_MIN_HEIGHT: '48px',
  SETTINGS_PANEL_PADDING: '16px 0',
  SETTINGS_TOGGLE_MARGIN: '20px',
  // Site item styles
  SITE_ITEM_BORDER_LEFT_WIDTH: '3px',
  SITE_ITEM_BORDER_RADIUS: '4px',
  SITE_ITEM_SCALE_HOVER: 1.001,
  SITE_ITEM_SCALE_NORMAL: 1,
  ACTION_BUTTON_SCALE_HOVER: 1.15,
  ACTION_BUTTON_SCALE_NORMAL: 1,
  ACTION_BUTTON_MIN_SIZE: '28px',
  ACTION_BUTTON_GAP: '2px',
  ACTION_BUTTON_MARGIN_LEFT: '8px',
  // Spacing
  SITE_URL_MARGIN_WITH_DESCRIPTION: '4px',
  SITE_URL_MARGIN_WITHOUT_DESCRIPTION: '6px',
  SEPARATOR_PADDING: '12px 0',
  SEARCH_CONTAINER_GAP: '8px',
  SEARCH_CONTAINER_MARGIN: '16px',
  // Scroll threshold
  SCROLL_THRESHOLD_PX: 5,
} as const;

/**
 * Animation and transition durations
 */
export const ANIMATION = {
  TRANSITION_DURATION: '0.2s',
  TRANSITION_EASING: 'ease',
} as const;

/**
 * Shadow and visual effects
 */
export const EFFECTS = {
  BOX_SHADOW_HOVER: '0 1px 3px rgba(0, 0, 0, 0.1)',
  ACTION_BUTTON_OPACITY_HOVER: 1,
  ACTION_BUTTON_OPACITY_NORMAL: 0.5,
} as const;

/**
 * Z-index values
 */
export const Z_INDEX = {
  NAVBAR: 1000,
} as const;

/**
 * Typography sizes
 */
export const TYPOGRAPHY = {
  FONT_SIZE_LARGE: '15px',
  FONT_SIZE_MEDIUM: '14px',
  FONT_SIZE_SMALL: '13px',
  FONT_SIZE_XSMALL: '12px',
  FONT_SIZE_XXSMALL: '11px',
  LINE_HEIGHT_SMALL: '16px',
  ICON_SIZE: '16px',
} as const;

/**
 * Spacing values
 */
export const SPACING = {
  XS: '4px',
  SM: '6px',
  MD: '8px',
  LG: '12px',
  XL: '16px',
  XXL: '20px',
  /** Screen reader only element dimensions */
  SR_ONLY_SIZE: '1px',
  SR_ONLY_MARGIN: '-1px',
  /** Divider height */
  DIVIDER_HEIGHT: '1px',
  /** Letter spacing for headers */
  LETTER_SPACING_HEADER: '0.5px',
} as const;
