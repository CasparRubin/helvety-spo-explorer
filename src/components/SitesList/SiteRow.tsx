// External dependencies
import * as React from "react";
import { Icon } from '@fluentui/react/lib/Icon';

// Types
import { ISite } from "../../types/Site";

// Utils and hooks
import { useHoverState, useKeyboardHandler } from '../../utils/hooks';
import { getPartialUrl } from '../../utils/urlUtils';
import { useSiteUrlLower, createSafeEventHandler } from '../../utils/componentUtils';

// Constants
import { CSS_VARIABLES, URL_CONSTANTS, TYPOGRAPHY, UI_MESSAGES } from '../../utils/constants';

// Styles
import {
  siteItemStyles,
  siteInfoStyles,
  siteTitleStyles,
  siteDescriptionStyles,
  getSiteUrlStyles,
  getSiteItemHoverStyles,
  getActionButtonsContainerStyles,
  getActionButtonHoverStyles,
} from '../../utils/styles';

/**
 * Props for SiteRow component
 * 
 * @interface ISiteRowProps
 */
export interface ISiteRowProps {
  /** Site data to display */
  site: ISite;
  /** ID of the currently selected site */
  selectedSiteId?: string;
  /** Set of favorite site URLs (for icon display) */
  favoriteSites: Set<string>;
  /** Callback when site is selected */
  onSiteSelect: (site: ISite) => void;
  /** Optional callback when favorite is toggled */
  onToggleFavorite?: (siteUrl: string) => void;
  /** Function to highlight search text in content */
  highlightText: (text: string) => JSX.Element;
  /** Whether to show full URL */
  showFullUrl: boolean;
  /** Whether to show partial URL (path only) */
  showPartialUrl: boolean;
  /** Whether to show site description */
  showDescription: boolean;
  /** Index of this site in the list (for aria-posinset) */
  index?: number;
  /** Total count of sites in the list (for aria-setsize) */
  totalCount?: number;
}

/**
 * SiteRow component - displays a single site row in the sites list
 * 
 * This component renders a single site row with:
 * - Site title, description, and URL (based on settings)
 * - Favorite toggle button
 * - Open in new tab button
 * - Hover effects and keyboard navigation
 * 
 * The component is memoized for performance optimization.
 * 
 * @component
 * @example
 * ```tsx
 * <SiteRow
 *   site={site}
 *   selectedSiteId={selectedSite?.id}
 *   favoriteSites={favoriteSites}
 *   onSiteSelect={handleSiteSelect}
 *   onToggleFavorite={handleToggleFavorite}
 *   highlightText={highlightText}
 *   showFullUrl={true}
 *   showPartialUrl={false}
 *   showDescription={true}
 * />
 * ```
 */
export const SiteRow: React.FC<ISiteRowProps> = React.memo(({
  site,
  selectedSiteId,
  favoriteSites,
  onSiteSelect,
  onToggleFavorite,
  highlightText,
  showFullUrl,
  showPartialUrl,
  showDescription,
  index,
  totalCount,
}) => {
  // Memoize site URL lowercase to avoid repeated calculations
  const siteUrlLower: string = useSiteUrlLower(site.url);
  const isFavorite: boolean = favoriteSites.has(siteUrlLower);
  const isSelected: boolean = selectedSiteId === site.id;
  
  // Use custom hooks for hover state management
  const [isHovered, handleMouseEnter, handleMouseLeave] = useHoverState(false);
  const [isFavoriteHovered, handleFavoriteMouseEnter, handleFavoriteMouseLeave] = useHoverState(false);
  const [isOpenInNewTabHovered, handleOpenInNewTabMouseEnter, handleOpenInNewTabMouseLeave] = useHoverState(false);
  
  const handleSiteClick = React.useCallback((): void => {
    onSiteSelect(site);
  }, [site, onSiteSelect]);

  const handleFavoriteClick = React.useCallback(
    createSafeEventHandler<React.MouseEvent<HTMLElement>>((_e: React.MouseEvent<HTMLElement>): void => {
      if (onToggleFavorite) {
        onToggleFavorite(site.url);
      }
    }),
    [site.url, onToggleFavorite]
  );

  const handleFavoriteActivate = React.useCallback((): void => {
    if (onToggleFavorite) {
      onToggleFavorite(site.url);
    }
  }, [site.url, onToggleFavorite]);

  const handleKeyDown = useKeyboardHandler(handleSiteClick);

  const handleFavoriteKeyDown = useKeyboardHandler((e: React.KeyboardEvent<HTMLElement>): void => {
    e.stopPropagation();
    e.preventDefault();
    handleFavoriteActivate();
  });

  const handleOpenInNewTabClick = React.useCallback(
    createSafeEventHandler<React.MouseEvent<HTMLElement>>((_e: React.MouseEvent<HTMLElement>): void => {
      window.open(site.url, '_blank');
    }),
    [site.url]
  );

  const handleOpenInNewTabKeyDown = useKeyboardHandler(
    createSafeEventHandler<React.KeyboardEvent<HTMLElement>>((_e: React.KeyboardEvent<HTMLElement>): void => {
      window.open(site.url, '_blank');
    })
  );

  // Build comprehensive aria-label for better screen reader support
  const ariaLabelParts: string[] = [`Site: ${site.title}`];
  if (site.description) {
    ariaLabelParts.push(`Description: ${site.description}`);
  }
  if (site.url) {
    ariaLabelParts.push(`URL: ${site.url}`);
  }
  if (isFavorite) {
    ariaLabelParts.push('Favorited');
  }
  const ariaLabel: string = ariaLabelParts.join('. ');

  return (
    <div
      style={{
        ...siteItemStyles,
        alignItems: 'center',
        ...getSiteItemHoverStyles(isHovered),
      }}
      role="option"
      id={site.id}
      aria-label={ariaLabel}
      aria-selected={isSelected}
      aria-posinset={index !== undefined ? index + 1 : undefined}
      aria-setsize={totalCount !== undefined ? totalCount : undefined}
      onClick={handleSiteClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      tabIndex={isSelected ? 0 : -1}
    >
      <div style={siteInfoStyles}>
        <div style={siteTitleStyles}>
          {highlightText(site.title)}
        </div>
        {showDescription && site.description && site.description.trim() && (
          <div style={siteDescriptionStyles}>
            {highlightText(site.description)}
          </div>
        )}
        {(() => {
          if (showFullUrl) {
            return (
              <div style={getSiteUrlStyles(showDescription && !!site.description?.trim())}>
                {highlightText(site.url)}
              </div>
            );
          }
          if (showPartialUrl) {
            const partialUrl: string = getPartialUrl(site.url);
            // Don't show partial URL if it's just "/" (home site)
            if (partialUrl === URL_CONSTANTS.ROOT_PATH) {
              return null;
            }
            return (
              <div style={getSiteUrlStyles(showDescription && Boolean(site.description?.trim()))}>
                {highlightText(partialUrl)}
              </div>
            );
          }
          return null;
        })()}
      </div>

      <div style={getActionButtonsContainerStyles(isHovered)}>
        {onToggleFavorite && (
          <div
            style={getActionButtonHoverStyles(isFavoriteHovered)}
            role="button"
            tabIndex={0}
            aria-label={isFavorite ? `${UI_MESSAGES.REMOVE_FROM_FAVORITES} ${site.title}` : `${UI_MESSAGES.ADD_TO_FAVORITES} ${site.title}`}
            onClick={handleFavoriteClick}
            onKeyDown={handleFavoriteKeyDown}
            onMouseEnter={handleFavoriteMouseEnter}
            onMouseLeave={handleFavoriteMouseLeave}
            title={isFavorite ? UI_MESSAGES.REMOVE_FROM_FAVORITES : UI_MESSAGES.ADD_TO_FAVORITES}
          >
            <Icon
              iconName={isFavorite ? 'FavoriteStarFill' : 'FavoriteStar'}
              style={{
                fontSize: TYPOGRAPHY.ICON_SIZE,
                color: isFavorite
                  ? CSS_VARIABLES.NEUTRAL_PRIMARY
                  : (isFavoriteHovered ? CSS_VARIABLES.NEUTRAL_PRIMARY : CSS_VARIABLES.NEUTRAL_SECONDARY),
                transition: 'color 0.2s ease',
              }}
              aria-hidden="true"
            />
          </div>
        )}
        <div
          style={getActionButtonHoverStyles(isOpenInNewTabHovered)}
          role="button"
          tabIndex={0}
          aria-label={`${UI_MESSAGES.OPEN_IN_NEW_TAB} ${site.title}`}
          onClick={handleOpenInNewTabClick}
          onKeyDown={handleOpenInNewTabKeyDown}
          onMouseEnter={handleOpenInNewTabMouseEnter}
          onMouseLeave={handleOpenInNewTabMouseLeave}
          title={UI_MESSAGES.OPEN_IN_NEW_TAB}
        >
          <Icon
            iconName="OpenInNewWindow"
            style={{
              fontSize: TYPOGRAPHY.ICON_SIZE,
              color: isOpenInNewTabHovered ? CSS_VARIABLES.NEUTRAL_PRIMARY : CSS_VARIABLES.NEUTRAL_SECONDARY,
              transition: 'color 0.2s ease',
            }}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}, (prevProps: ISiteRowProps, nextProps: ISiteRowProps): boolean => {
  // Custom comparison function for React.memo
  // Returns true if props are equal (skip re-render), false if different (re-render)
  // Optimized: cheapest checks first, early returns for common changes
  
  // Fast reference equality checks for stable props (callbacks, Sets)
  // These are typically stable references, so checking them first is efficient
  if (
    prevProps.onSiteSelect !== nextProps.onSiteSelect ||
    prevProps.onToggleFavorite !== nextProps.onToggleFavorite ||
    prevProps.highlightText !== nextProps.highlightText ||
    prevProps.favoriteSites !== nextProps.favoriteSites
  ) {
    return false;
  }
  
  // Check display settings (cheap boolean/number comparisons)
  // These are primitive values, very fast to compare
  if (
    prevProps.selectedSiteId !== nextProps.selectedSiteId ||
    prevProps.showFullUrl !== nextProps.showFullUrl ||
    prevProps.showPartialUrl !== nextProps.showPartialUrl ||
    prevProps.showDescription !== nextProps.showDescription ||
    prevProps.index !== nextProps.index ||
    prevProps.totalCount !== nextProps.totalCount
  ) {
    return false;
  }
  
  // Fast reference equality check for site object (most common optimization)
  // If site object reference is unchanged, all properties are the same
  if (prevProps.site === nextProps.site) {
    return true;
  }
  
  // Site object changed - validate and check individual properties
  const prevSite: ISite = prevProps.site;
  const nextSite: ISite = nextProps.site;
  
  // Validate site objects have required properties (defensive check)
  if (!prevSite || !nextSite || typeof prevSite !== 'object' || typeof nextSite !== 'object') {
    return false;
  }
  
  // Early return if site ID changed (most common case when site object changes)
  // ID comparison is very fast (string comparison)
  if (prevSite.id !== nextSite.id) {
    return false;
  }
  
  // Check site properties (only check if ID is same)
  // These are the properties that affect rendering
  // Order matters: check most likely to change properties first
  if (
    prevSite.title !== nextSite.title ||
    prevSite.url !== nextSite.url ||
    prevSite.description !== nextSite.description
  ) {
    return false;
  }
  
  // All props are equal, skip re-render
  return true;
});

SiteRow.displayName = 'SiteRow';
