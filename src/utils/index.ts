/**
 * Utils module - centralized export point for all utility functions
 *
 * This module re-exports utilities from their respective modules for convenient importing.
 * Import utilities from this file to maintain clean imports.
 *
 * Organization:
 * - Constants: Application-wide constants (API endpoints, UI messages, layout values)
 * - Error utilities: Error types, type guards, logging, categorization
 * - Storage utilities: localStorage operations with error handling
 * - URL utilities: URL validation, normalization, and parsing
 * - Navigation utilities: Site navigation helpers
 * - Site utilities: Site data manipulation (sorting, filtering)
 * - Component utilities: React component helpers (memoization, highlighting)
 * - DOM utilities: DOM queries and focus management
 * - Validation utilities: Type guards and runtime validation
 * - Error handling utilities: Error recovery patterns and safe execution wrappers
 * - Service utilities: Shared service patterns (user ID normalization, storage keys)
 * - Custom hooks: React hooks for sites, favorites, and settings
 * - Styles: Style definitions for components
 */

// Constants
export * from "./constants/index";

// Error utilities
export * from "./errorUtils";
export * from "./errors";

// Storage utilities
export * from "./storageUtils";

// URL utilities
export * from "./urlUtils";

// Navigation utilities
export * from "./navigationUtils";

// Site utilities
export * from "./siteUtils";

// Component utilities
export * from "./componentUtils";

// DOM utilities
export * from "./domUtils";

// Validation utilities
// Note: createSiteId and createWebId are included in the wildcard export above
export * from "./validationUtils";

// Error handling utilities
export * from "./errorHandlingUtils";
export * from "./errorRetryUtils";
export * from "./errorHandlerFactories";

// Service utilities
export * from "./serviceUtils";

// Custom hooks
// Note: useServiceInitialization is an internal utility hook and is not exported
export * from "./hooks";
export * from "./customHooks/useSites";
export * from "./customHooks/useFavorites";
export * from "./customHooks/useSettings";
export * from "./customHooks/useLicense";

// Styles
export * from "./styles";
