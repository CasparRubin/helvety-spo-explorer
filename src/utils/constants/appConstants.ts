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
  /** Short delay for focus operations after DOM updates (e.g., panel animations) */
  FOCUS_DELAY_SHORT_MS: 100,
  /** Medium delay for focus operations after DOM updates (e.g., panel opens) */
  FOCUS_DELAY_MEDIUM_MS: 150,
  /** API request timeout - prevents hanging requests (30 seconds) */
  API_REQUEST_TIMEOUT_MS: 30000,
} as const;

/**
 * URL-related constants
 */
export const URL_CONSTANTS = {
  /** Root URL path */
  ROOT_PATH: '/',
} as const;
