import { CSS_VARIABLES, LAYOUT, Z_INDEX } from "../constants";

/**
 * Navbar component styles
 */

/**
 * Navbar container styles
 */
export const navbarStyles: React.CSSProperties = {
  backgroundColor: CSS_VARIABLES.BACKGROUND,
  borderBottom: "0",
  borderBottomWidth: "0",
  borderBottomStyle: "none",
  borderBottomColor: "transparent",
  padding: LAYOUT.NAVBAR_PADDING,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  height: LAYOUT.NAVBAR_HEIGHT,
  zIndex: Z_INDEX.NAVBAR,
  width: "100%",
  boxSizing: "border-box", // Include padding in width calculation
  overflow: "hidden", // Prevent content from overflowing
} as const;

/**
 * Navbar inner container styles
 */
export const navbarInnerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: LAYOUT.NAVBAR_GAP,
  width: "100%",
  minWidth: 0, // Allow flex container to shrink
  boxSizing: "border-box", // Include padding in width calculation
} as const;

/**
 * Navbar content area styles
 */
export const navbarContentStyles: React.CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  gap: LAYOUT.COMBOBOX_GAP,
  minWidth: 0, // Allow flex item to shrink below content size
  overflow: "hidden", // Prevent overflow
} as const;
