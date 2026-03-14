import { CSS_VARIABLES, LAYOUT, TYPOGRAPHY, SPACING } from "../constants";

/**
 * Common/shared style objects used across multiple components
 */

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
