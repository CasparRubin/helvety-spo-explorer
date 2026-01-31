import { CSS_VARIABLES, LAYOUT, TYPOGRAPHY, SPACING } from "../constants";

/**
 * Common/shared style objects used across multiple components
 */

/**
 * Option container styles
 */
export const optionContainerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: LAYOUT.OPTION_PADDING,
  minHeight: LAYOUT.OPTION_MIN_HEIGHT,
  cursor: "pointer",
} as const;

/**
 * Site info container styles
 */
export const siteInfoStyles: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: 0, // Gap handled by individual element margins
  justifyContent: "center",
} as const;

/**
 * Site title styles
 */
export const siteTitleStyles: React.CSSProperties = {
  fontSize: TYPOGRAPHY.FONT_SIZE_LARGE,
  fontWeight: 500,
  color: CSS_VARIABLES.NEUTRAL_PRIMARY,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

/**
 * Site description styles
 */
export const siteDescriptionStyles: React.CSSProperties = {
  fontSize: TYPOGRAPHY.FONT_SIZE_XSMALL,
  color: CSS_VARIABLES.NEUTRAL_TERTIARY,
  opacity: 0.85,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  marginTop: SPACING.SM, // Add spacing between title and description (bigger than description to URL)
} as const;

/**
 * Site URL styles
 */
export const siteUrlStyles: React.CSSProperties = {
  fontSize: TYPOGRAPHY.FONT_SIZE_XXSMALL,
  color: CSS_VARIABLES.NEUTRAL_TERTIARY,
  opacity: 0.7,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  fontWeight: 400,
  marginTop: SPACING.XS, // Add spacing between description and URL
} as const;

/**
 * Following icon container styles (for SharePoint Following feature)
 */
export const followIconContainerStyles: React.CSSProperties = {
  marginLeft: 0, // Margin handled by parent container
  cursor: "pointer",
  padding: SPACING.XS,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
} as const;

/**
 * Header styles for followed sites section (SharePoint Following)
 */
export const followingHeaderStyles: React.CSSProperties = {
  padding: LAYOUT.OPTION_PADDING,
  fontSize: TYPOGRAPHY.FONT_SIZE_XSMALL,
  fontWeight: 600,
  color: CSS_VARIABLES.NEUTRAL_SECONDARY,
  textTransform: "uppercase",
  letterSpacing: SPACING.LETTER_SPACING_HEADER,
} as const;

/**
 * Divider styles
 */
export const dividerStyles: React.CSSProperties = {
  height: SPACING.DIVIDER_HEIGHT,
  backgroundColor: CSS_VARIABLES.NEUTRAL_2,
  margin: `${SPACING.XS} 0`,
} as const;

/**
 * Empty state message styles
 */
export const emptyStateStyles: React.CSSProperties = {
  padding: `${SPACING.XL} ${SPACING.LG}`,
  fontSize: TYPOGRAPHY.FONT_SIZE_MEDIUM,
  color: CSS_VARIABLES.NEUTRAL_SECONDARY,
  textAlign: "center",
} as const;

/**
 * Loading container styles
 */
export const loadingContainerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: LAYOUT.COMBOBOX_GAP,
} as const;

/**
 * Empty sites message styles
 */
export const emptySitesStyles: React.CSSProperties = {
  color: CSS_VARIABLES.NEUTRAL_SECONDARY,
  fontSize: TYPOGRAPHY.FONT_SIZE_MEDIUM,
} as const;

/**
 * Screen reader only text styles
 * Hides content visually but keeps it accessible to screen readers
 */
export const srOnlyStyles: React.CSSProperties = {
  position: "absolute",
  width: SPACING.SR_ONLY_SIZE,
  height: SPACING.SR_ONLY_SIZE,
  padding: 0,
  margin: SPACING.SR_ONLY_MARGIN,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  borderWidth: 0,
} as const;
