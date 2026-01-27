/**
 * Application-wide constants (storage, cache, defaults, etc.)
 */

/**
 * Storage key prefixes for localStorage
 */
export const STORAGE_KEYS = {
  SETTINGS_PREFIX: 'helvety-spo-explorer-settings',
  FAVORITES_PREFIX: 'helvety-spo-explorer-favorites',
} as const;

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  DURATION_MS: 5 * 60 * 1000, // 5 minutes
} as const;

/**
 * Default user settings
 */
export const DEFAULT_SETTINGS = {
  showFullUrl: false,
  showPartialUrl: false,
  showDescription: false,
  openInNewTab: false,
} as const;

/**
 * Default user ID fallback
 */
export const DEFAULT_USER_ID = 'default';

/**
 * Keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
  OPEN_COMBOBOX: 'k',
} as const;

/**
 * Timeout values for async operations
 */
export const TIMEOUTS = {
  /** Immediate timeout (next tick) - used for DOM updates */
  IMMEDIATE: 0,
} as const;

/**
 * URL-related constants
 */
export const URL_CONSTANTS = {
  /** Root URL path */
  ROOT_PATH: '/',
} as const;
