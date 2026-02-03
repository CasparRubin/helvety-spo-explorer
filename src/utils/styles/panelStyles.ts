import { CSS_VARIABLES, SPACING, TYPOGRAPHY } from "../constants";

/**
 * Panel component styles
 */

/**
 * Settings panel content styles
 */
export const settingsPanelContentStyles: React.CSSProperties = {
  padding: "16px 0",
} as const;

/**
 * Settings toggle styles
 */
export const settingsToggleStyles = {
  root: {
    marginBottom: SPACING.MD,
  },
  label: {
    display: "block", // Ensure label is visible
  },
} as const;

/**
 * Pivot (tabs) styles
 */
export const pivotStyles = {
  root: {
    marginTop: SPACING.XL,
    backgroundColor: CSS_VARIABLES.BACKGROUND,
  },
  link: {
    backgroundColor: CSS_VARIABLES.BACKGROUND,
  },
  linkContent: {
    backgroundColor: CSS_VARIABLES.BACKGROUND,
  },
} as const;

/**
 * PivotItem content wrapper styles - allows flex children to fill available height
 */
export const pivotItemContentStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0, // Allow flex container to shrink
  overflow: "hidden",
} as const;

/**
 * Settings section container styles
 */
export const settingsSectionStyles: React.CSSProperties = {
  paddingBottom: SPACING.XL,
} as const;

/**
 * Settings section header styles
 */
export const settingsSectionHeaderStyles: React.CSSProperties = {
  fontSize: TYPOGRAPHY.FONT_SIZE_MEDIUM,
  fontWeight: 600,
  color: CSS_VARIABLES.NEUTRAL_PRIMARY,
  marginBottom: SPACING.SM,
  letterSpacing: SPACING.LETTER_SPACING_HEADER,
} as const;

/**
 * Settings section description styles
 */
export const settingsSectionDescriptionStyles: React.CSSProperties = {
  fontSize: TYPOGRAPHY.FONT_SIZE_SMALL,
  color: CSS_VARIABLES.NEUTRAL_SECONDARY,
  marginBottom: SPACING.LG,
  lineHeight: "20px",
} as const;
