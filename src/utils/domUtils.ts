/**
 * DOM utility functions for safe element queries and focus management
 *
 * This module provides type-safe utilities for DOM manipulation, including:
 * - Type guards for DOM element queries
 * - Safe focus management functions
 * - Error handling for DOM operations
 */

import { logWarning, extractErrorMessage } from "./errorUtils";

const LOG_SOURCE = "domUtils";

/**
 * Type guard to check if an element is an HTMLInputElement
 *
 * @param element - The element to check
 * @returns true if the element is an HTMLInputElement, false otherwise
 */
/* eslint-disable @rushstack/no-new-null -- DOM API returns null, not undefined */
export function isHTMLInputElement(
  element: Element | null
): element is HTMLInputElement {
  /* eslint-enable @rushstack/no-new-null */
  return element !== null && element instanceof HTMLInputElement;
}

/**
 * Type guard to check if an element is an HTMLElement
 *
 * @param element - The element to check
 * @returns true if the element is an HTMLElement, false otherwise
 */
// eslint-disable-next-line @rushstack/no-new-null -- DOM API returns null, not undefined
export function isHTMLElement(element: Element | null): element is HTMLElement {
  return element !== null && element instanceof HTMLElement;
}

/**
 * Type guard to check if an element has a focus method
 *
 * @param element - The element to check
 * @returns true if the element has a focus method, false otherwise
 */
/* eslint-disable @rushstack/no-new-null -- DOM API returns null, not undefined */
export function isFocusableElement(
  element: Element | null
): element is HTMLElement & { focus: () => void } {
  /* eslint-enable @rushstack/no-new-null */
  return (
    element !== null &&
    element instanceof HTMLElement &&
    typeof (element as HTMLElement).focus === "function"
  );
}

/**
 * Safely queries for a search input element using multiple selectors
 *
 * Tries multiple selectors in order of preference to find a search input element.
 * Returns null if no matching element is found.
 *
 * Input validation:
 * - Validates document is available (SSR safety)
 * - Validates querySelector is available
 * - Validates selector strings are non-empty
 *
 * @returns The found HTMLInputElement or null if not found
 * @throws Never throws - returns null on error
 *
 * @example
 * ```typescript
 * const searchInput = querySearchInput();
 * if (searchInput) {
 *   searchInput.focus();
 * }
 * ```
 */
// eslint-disable-next-line @rushstack/no-new-null -- DOM API returns null, not undefined
export function querySearchInput(): HTMLInputElement | null {
  // Validate document is available (SSR safety)
  if (typeof document === "undefined" || !document.querySelector) {
    return null;
  }

  const selectors: string[] = [
    '[role="searchbox"]',
    '[aria-label*="Search"]',
    'input[type="text"]',
  ];

  for (const selector of selectors) {
    // Validate selector is a non-empty string
    if (typeof selector !== "string" || selector.length === 0) {
      continue;
    }

    try {
      const element: Element | null = document.querySelector(selector);
      if (isHTMLInputElement(element)) {
        return element;
      }
    } catch (queryError: unknown) {
      // Invalid selector or other query error - log and continue to next selector
      logWarning(
        LOG_SOURCE,
        extractErrorMessage(queryError),
        `Invalid selector: ${selector}`
      );
      continue;
    }
  }

  return null;
}

/**
 * Safely queries for the navbar button that opens the sites panel
 *
 * Tries multiple selectors in order of preference to find the navbar button.
 * Returns null if no matching element is found.
 *
 * Input validation:
 * - Validates document is available (SSR safety)
 * - Validates querySelector is available
 * - Validates selector strings are non-empty
 *
 * @returns The found HTMLElement or null if not found
 * @throws Never throws - returns null on error
 *
 * @example
 * ```typescript
 * const navbarButton = queryNavbarButton();
 * if (navbarButton) {
 *   navbarButton.focus();
 * }
 * ```
 */
// eslint-disable-next-line @rushstack/no-new-null -- DOM API returns null, not undefined
export function queryNavbarButton(): HTMLElement | null {
  // Validate document is available (SSR safety)
  if (typeof document === "undefined" || !document.querySelector) {
    return null;
  }

  const selectors: string[] = [
    '[aria-label*="Open sites panel"]',
    '[aria-label*="Sites you have access to"]',
    'button[aria-expanded="true"]',
  ];

  for (const selector of selectors) {
    // Validate selector is a non-empty string
    if (typeof selector !== "string" || selector.length === 0) {
      continue;
    }

    try {
      const element: Element | null = document.querySelector(selector);
      if (isHTMLElement(element)) {
        return element;
      }
    } catch (queryError: unknown) {
      // Invalid selector or other query error - log and continue to next selector
      logWarning(
        LOG_SOURCE,
        extractErrorMessage(queryError),
        `Invalid selector: ${selector}`
      );
      continue;
    }
  }

  return null;
}

/**
 * Safely focuses an element with error handling
 *
 * Attempts to focus the provided element, catching and logging any errors
 * that occur during the focus operation. This is useful for focus management
 * in accessibility scenarios where elements may not always be focusable.
 *
 * Input validation:
 * - Validates element is not null/undefined
 * - Validates element has focus method
 * - Validates element is attached to DOM (if possible)
 *
 * @param element - The element to focus
 * @param context - Optional context information for error logging
 * @returns true if focus was successful, false otherwise
 * @throws Never throws - errors are caught and logged
 *
 * @example
 * ```typescript
 * const input = querySearchInput();
 * if (input) {
 *   safeFocus(input, 'Focusing search input after panel open');
 * }
 * ```
 */
export function safeFocus(
  element: HTMLElement & { focus: () => void },
  context?: string
): boolean {
  // Validate element is not null/undefined
  if (!element) {
    logWarning(
      LOG_SOURCE,
      "Element is null or undefined",
      context ?? "safeFocus"
    );
    return false;
  }

  // Validate element has focus method
  if (!isFocusableElement(element)) {
    logWarning(
      LOG_SOURCE,
      "Element does not have focus method",
      context ?? "safeFocus"
    );
    return false;
  }

  try {
    element.focus();
    return true;
  } catch (focusError: unknown) {
    // Some browsers may throw if element is not focusable or not attached to DOM
    // Log but don't break the flow
    const errorContext: string = context
      ? `${context}: Failed to focus element`
      : "Failed to focus element";
    logWarning(LOG_SOURCE, extractErrorMessage(focusError), errorContext);
    return false;
  }
}

/**
 * Safely focuses an element after a delay with error handling
 *
 * Similar to safeFocus, but waits for a specified delay before attempting
 * to focus. This is useful when elements may not be immediately available
 * in the DOM (e.g., after animations or transitions).
 *
 * Input validation:
 * - Validates element is focusable
 * - Validates delayMs is a valid number
 * - Validates setTimeout is available
 *
 * @param element - The element to focus
 * @param delayMs - Delay in milliseconds before focusing (default: 0)
 * @param context - Optional context information for error logging
 * @returns A function that cancels the delayed focus operation, or undefined if element is not focusable
 * @throws Never throws - returns undefined on error
 *
 * @example
 * ```typescript
 * const input = querySearchInput();
 * if (input) {
 *   const cancel = safeFocusDelayed(input, 150, 'Focusing search input after panel animation');
 *   // Later, if needed:
 *   // cancel?.();
 * }
 * ```
 */
export function safeFocusDelayed(
  element: HTMLElement & { focus: () => void },
  delayMs: number = 0,
  context?: string
): (() => void) | undefined {
  // Validate element is focusable
  if (!isFocusableElement(element)) {
    return undefined;
  }

  // Validate delayMs is a valid number
  if (typeof delayMs !== "number" || !Number.isFinite(delayMs) || delayMs < 0) {
    logWarning(
      LOG_SOURCE,
      `Invalid delayMs: ${delayMs}`,
      context ?? "safeFocusDelayed"
    );
    // Use 0 as fallback
    delayMs = 0;
  }

  // Validate setTimeout is available
  if (typeof setTimeout === "undefined") {
    logWarning(
      LOG_SOURCE,
      "setTimeout is not available",
      context ?? "safeFocusDelayed"
    );
    return undefined;
  }

  try {
    const timeoutId: ReturnType<typeof setTimeout> = setTimeout((): void => {
      safeFocus(element, context);
    }, delayMs);

    return (): void => {
      try {
        clearTimeout(timeoutId);
      } catch (clearError: unknown) {
        logWarning(
          LOG_SOURCE,
          extractErrorMessage(clearError),
          "Failed to clear timeout"
        );
      }
    };
  } catch (timeoutError: unknown) {
    logWarning(
      LOG_SOURCE,
      extractErrorMessage(timeoutError),
      context ?? "safeFocusDelayed"
    );
    return undefined;
  }
}
