import {
  CSS_VARIABLES,
  LAYOUT,
  ANIMATION,
  EFFECTS,
  SPACING,
} from "../constants";
import { siteUrlStyles } from "./commonStyles";

/**
 * Sites list component styles
 */

/**
 * Sites list container styles
 */
export const sitesListContainerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
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
  overflowY: "auto",
  overflowX: "hidden",
  padding: `${SPACING.XS} 0`,
} as const;

/**
 * Scrollable container styles for sites list
 * Provides native scrolling with visible scrollbar
 * Height is set to viewport height minus 250px
 */
export const scrollableContainerStyles: React.CSSProperties = {
  height: "calc(100vh - 250px)",
  overflowY: "auto",
  overflowX: "hidden",
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  // Ensure scrollbar is visible
  scrollbarWidth: "thin", // Firefox
  scrollbarColor: `${CSS_VARIABLES.NEUTRAL_5} transparent`, // Firefox
  // Webkit scrollbar styling
  WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
} as const;

/**
 * Site item styles
 * Note: backgroundColor is set by getSiteItemBackgroundStyles for alternating rows
 */
export const siteItemStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "6px 12px",
  cursor: "pointer",
  border: `1px solid ${CSS_VARIABLES.NEUTRAL_6}`,
  borderRadius: LAYOUT.SITE_ITEM_BORDER_RADIUS,
  marginBottom: SPACING.XS,
  transition:
    "background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
} as const;

/**
 * Site item background styles - alternating colors for visual separation
 * @param index - Optional index of the row (0-based)
 * @returns Style object with appropriate background color
 */
export function getSiteItemBackgroundStyles(
  index?: number
): React.CSSProperties {
  const isEven: boolean = index === undefined ? true : index % 2 === 0;

  return {
    backgroundColor: isEven
      ? CSS_VARIABLES.BACKGROUND
      : "rgba(128, 128, 128, 0.04)",
  };
}

/**
 * Bottom fade overlay styles for scrollable container
 * Creates a gradient fade effect at the bottom to indicate more content
 */
export const bottomFadeOverlayStyles: React.CSSProperties = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  height: "48px",
  background: `linear-gradient(to bottom, transparent, ${CSS_VARIABLES.BACKGROUND})`,
  pointerEvents: "none",
  transition: "opacity 0.2s ease",
  zIndex: 1,
} as const;

/**
 * Scrollable container wrapper styles
 * Provides relative positioning context for absolute fade overlay
 */
export const scrollableContainerWrapperStyles: React.CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: "100%",
} as const;

/**
 * Site item hover styles
 * @param isHovered - Whether the item is currently hovered
 * @returns Style object with hover-specific properties
 */
export function getSiteItemHoverStyles(
  isHovered: boolean
): React.CSSProperties {
  return {
    ...(isHovered && { backgroundColor: "rgba(128, 128, 128, 0.12)" }),
    borderColor: isHovered ? CSS_VARIABLES.NEUTRAL_10 : CSS_VARIABLES.NEUTRAL_6,
    boxShadow: isHovered ? EFFECTS.BOX_SHADOW_HOVER : "none",
    transform: isHovered
      ? `scale(${LAYOUT.SITE_ITEM_SCALE_HOVER})`
      : `scale(${LAYOUT.SITE_ITEM_SCALE_NORMAL})`,
    transition: `background-color ${ANIMATION.TRANSITION_DURATION} ${ANIMATION.TRANSITION_EASING}, border-color ${ANIMATION.TRANSITION_DURATION} ${ANIMATION.TRANSITION_EASING}, box-shadow ${ANIMATION.TRANSITION_DURATION} ${ANIMATION.TRANSITION_EASING}, transform ${ANIMATION.TRANSITION_DURATION} ${ANIMATION.TRANSITION_EASING}`,
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
    marginTop: hasDescription
      ? LAYOUT.SITE_URL_MARGIN_WITH_DESCRIPTION
      : LAYOUT.SITE_URL_MARGIN_WITHOUT_DESCRIPTION,
  };
}

/**
 * Action buttons container styles
 * @param isHovered - Whether the parent item is hovered
 * @returns Style object for the action buttons container
 */
export function getActionButtonsContainerStyles(
  isHovered: boolean
): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: LAYOUT.ACTION_BUTTON_GAP,
    marginLeft: LAYOUT.ACTION_BUTTON_MARGIN_LEFT,
    opacity: isHovered
      ? EFFECTS.ACTION_BUTTON_OPACITY_HOVER
      : EFFECTS.ACTION_BUTTON_OPACITY_NORMAL,
    transition: `opacity ${ANIMATION.TRANSITION_DURATION} ${ANIMATION.TRANSITION_EASING}`,
  };
}

/**
 * Search container styles
 */
export const searchContainerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: LAYOUT.SEARCH_CONTAINER_GAP,
  marginTop: LAYOUT.SEARCH_CONTAINER_MARGIN,
  marginBottom: LAYOUT.SEARCH_CONTAINER_MARGIN,
} as const;

/**
 * Separator container styles
 */
export const separatorContainerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: LAYOUT.SEPARATOR_PADDING,
} as const;
