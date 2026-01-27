import * as React from 'react';

/**
 * Custom hook for managing hover state
 * 
 * Provides a simple way to track whether an element is being hovered over.
 * Returns the hover state and event handlers for mouse enter and leave events.
 * 
 * @param initialValue - Initial hover state value (default: false)
 * @returns Tuple containing [isHovered, handleMouseEnter, handleMouseLeave]
 *   - isHovered: Current hover state
 *   - handleMouseEnter: Callback to set hover state to true
 *   - handleMouseLeave: Callback to set hover state to false
 * 
 * @example
 * ```typescript
 * const [isHovered, handleMouseEnter, handleMouseLeave] = useHoverState();
 * 
 * return (
 *   <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
 *     {isHovered ? 'Hovered!' : 'Not hovered'}
 *   </div>
 * );
 * ```
 */
export function useHoverState(initialValue: boolean = false): [
  boolean,
  () => void,
  () => void
] {
  const [isHovered, setIsHovered] = React.useState<boolean>(initialValue);

  const handleMouseEnter = React.useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    setIsHovered(false);
  }, []);

  return [isHovered, handleMouseEnter, handleMouseLeave];
}

/**
 * Custom hook for managing keyboard event handlers
 * 
 * Creates a keyboard event handler that responds to Enter and Space key presses,
 * which are standard keys for activating interactive elements. This improves
 * accessibility by ensuring consistent keyboard navigation behavior.
 * 
 * @param onActivate - Callback function to execute when Enter or Space is pressed
 * @returns Keyboard event handler function that can be used with onKeyDown
 * 
 * @example
 * ```typescript
 * const handleKeyDown = useKeyboardHandler(() => {
 *   // Handle activation
 *   activateItem();
 * });
 * 
 * return <div onKeyDown={handleKeyDown} tabIndex={0}>Press Enter or Space</div>;
 * ```
 */
export function useKeyboardHandler(
  onActivate: (e: React.KeyboardEvent<HTMLElement>) => void
): (e: React.KeyboardEvent<HTMLElement>) => void {
  return React.useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate(e);
      }
    },
    [onActivate]
  );
}
