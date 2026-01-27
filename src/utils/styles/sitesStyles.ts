import { CSS_VARIABLES, LAYOUT, ANIMATION, EFFECTS, SPACING } from '../constants';
import { siteUrlStyles, followIconContainerStyles } from './commonStyles';

/**
 * Sites list component styles
 */

/**
 * Sites list container styles
 */
export const sitesListContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',
} as const;

/**
 * Search input styles
 */
export const searchInputStyles = {
  root: {
    marginTop: SPACING.XL,
    marginBottom: SPACING.XL,
  },
} as const;

/**
 * Sites list styles
 */
export const sitesListStyles: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: `${SPACING.XS} 0`,
} as const;

/**
 * Scrollable container styles for sites list
 * Provides native scrolling with visible scrollbar
 * Height is set to viewport height minus 250px
 */
export const scrollableContainerStyles: React.CSSProperties = {
  height: 'calc(100vh - 250px)',
  overflowY: 'auto',
  overflowX: 'hidden',
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',
  // Ensure scrollbar is visible
  scrollbarWidth: 'thin', // Firefox
  scrollbarColor: `${CSS_VARIABLES.NEUTRAL_5} transparent`, // Firefox
  // Webkit scrollbar styling
  WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
} as const;

/**
 * Site item styles
 * Note: minHeight is set dynamically in component based on visible fields
 */
export const siteItemStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '6px 12px',
  cursor: 'pointer',
  borderBottom: `1px solid ${CSS_VARIABLES.NEUTRAL_2}`,
  transition: 'background-color 0.2s ease',
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',
  overflow: 'hidden',
} as const;

/**
 * Bottom fade overlay styles for scrollable container
 * Creates a gradient fade effect at the bottom to indicate more content
 */
export const bottomFadeOverlayStyles: React.CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: '48px',
  background: `linear-gradient(to bottom, transparent, ${CSS_VARIABLES.BACKGROUND})`,
  pointerEvents: 'none',
  transition: 'opacity 0.2s ease',
  zIndex: 1,
} as const;

/**
 * Scrollable container wrapper styles
 * Provides relative positioning context for absolute fade overlay
 */
export const scrollableContainerWrapperStyles: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  maxWidth: '100%',
} as const;

/**
 * Site item hover styles - base styles that can be merged with siteItemStyles
 * @param isHovered - Whether the item is currently hovered
 * @returns Style object with hover-specific properties
 */
export function getSiteItemHoverStyles(isHovered: boolean): React.CSSProperties {
  return {
    backgroundColor: isHovered ? CSS_VARIABLES.BACKGROUND_HOVER_STRONG : 'transparent',
    borderLeftWidth: LAYOUT.SITE_ITEM_BORDER_LEFT_WIDTH,
    borderLeftStyle: 'solid',
    borderLeftColor: isHovered ? CSS_VARIABLES.BORDER_HOVER : 'transparent',
    boxShadow: isHovered ? EFFECTS.BOX_SHADOW_HOVER : 'none',
    transform: isHovered ? `scale(${LAYOUT.SITE_ITEM_SCALE_HOVER})` : `scale(${LAYOUT.SITE_ITEM_SCALE_NORMAL})`,
    transition: `background-color ${ANIMATION.TRANSITION_DURATION} ${ANIMATION.TRANSITION_EASING}, border-left-color ${ANIMATION.TRANSITION_DURATION} ${ANIMATION.TRANSITION_EASING}, box-shadow ${ANIMATION.TRANSITION_DURATION} ${ANIMATION.TRANSITION_EASING}, transform ${ANIMATION.TRANSITION_DURATION} ${ANIMATION.TRANSITION_EASING}`,
  };
}

/**
 * Site URL styles with conditional margin
 * @param hasDescription - Whether the site has a description
 * @returns Style object with appropriate margin
 */
export function getSiteUrlStyles(hasDescription: boolean): React.CSSProperties {
  return {
    ...siteUrlStyles,
    marginTop: hasDescription ? LAYOUT.SITE_URL_MARGIN_WITH_DESCRIPTION : LAYOUT.SITE_URL_MARGIN_WITHOUT_DESCRIPTION,
  };
}

/**
 * Action buttons container styles
 * @param isHovered - Whether the parent item is hovered
 * @returns Style object for the action buttons container
 */
export function getActionButtonsContainerStyles(isHovered: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: LAYOUT.ACTION_BUTTON_GAP,
    marginLeft: LAYOUT.ACTION_BUTTON_MARGIN_LEFT,
    opacity: isHovered ? EFFECTS.ACTION_BUTTON_OPACITY_HOVER : EFFECTS.ACTION_BUTTON_OPACITY_NORMAL,
    transition: `opacity ${ANIMATION.TRANSITION_DURATION} ${ANIMATION.TRANSITION_EASING}`,
  };
}

/**
 * Action button hover styles (for favorite and open in new tab buttons)
 * @param isHovered - Whether the button is hovered
 * @returns Style object with hover-specific properties
 */
export function getActionButtonHoverStyles(isHovered: boolean): React.CSSProperties {
  return {
    ...followIconContainerStyles,
    backgroundColor: isHovered ? CSS_VARIABLES.ACTION_BUTTON_HOVER : 'transparent',
    border: isHovered ? `1px solid ${CSS_VARIABLES.BORDER_HOVER}` : '1px solid transparent',
    borderRadius: LAYOUT.SITE_ITEM_BORDER_RADIUS,
    transition: `background-color ${ANIMATION.TRANSITION_DURATION} ${ANIMATION.TRANSITION_EASING}, transform ${ANIMATION.TRANSITION_DURATION} ${ANIMATION.TRANSITION_EASING}, border-color ${ANIMATION.TRANSITION_DURATION} ${ANIMATION.TRANSITION_EASING}`,
    transform: isHovered ? `scale(${LAYOUT.ACTION_BUTTON_SCALE_HOVER})` : `scale(${LAYOUT.ACTION_BUTTON_SCALE_NORMAL})`,
    minWidth: LAYOUT.ACTION_BUTTON_MIN_SIZE,
    minHeight: LAYOUT.ACTION_BUTTON_MIN_SIZE,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}

/**
 * Search container styles
 */
export const searchContainerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: LAYOUT.SEARCH_CONTAINER_GAP,
  marginTop: LAYOUT.SEARCH_CONTAINER_MARGIN,
  marginBottom: LAYOUT.SEARCH_CONTAINER_MARGIN,
} as const;

/**
 * Separator container styles
 */
export const separatorContainerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: LAYOUT.SEPARATOR_PADDING,
} as const;

/**
 * Refresh button styles
 */
export const refreshButtonStyles = {
  root: {
    color: CSS_VARIABLES.NEUTRAL_PRIMARY,
    flexShrink: 0,
  },
  rootHovered: {
    backgroundColor: CSS_VARIABLES.BACKGROUND_HOVER,
    color: CSS_VARIABLES.NEUTRAL_PRIMARY,
  },
  rootPressed: {
    backgroundColor: CSS_VARIABLES.BACKGROUND_HOVER,
    color: CSS_VARIABLES.NEUTRAL_PRIMARY,
  },
  rootDisabled: {
    color: CSS_VARIABLES.NEUTRAL_TERTIARY,
  },
} as const;
