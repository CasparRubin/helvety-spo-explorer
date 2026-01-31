// External dependencies
import * as React from "react";
import { TextField } from "@fluentui/react/lib/TextField";
import { Spinner, SpinnerSize } from "@fluentui/react/lib/Spinner";
import { MessageBar, MessageBarType } from "@fluentui/react/lib/MessageBar";
import { IconButton, PrimaryButton } from "@fluentui/react/lib/Button";
import { Separator } from "@fluentui/react/lib/Separator";

// Internal components
import { SiteRow } from "./SiteRow";

// Types
import { ISitesListProps } from "../../types/ComponentProps";
import { ISite } from "../../types/Site";

// Utils
import { sortSitesAlphabetically } from "../../utils/siteUtils";
import {
  siteMatchesSearch,
  highlightText as highlightTextUtil,
} from "../../utils/componentUtils";
import { compareSitesListProps } from "../../utils/componentComparisonUtils";

// Constants
import {
  LAYOUT,
  TIMEOUTS,
  UI_MESSAGES,
  CSS_VARIABLES,
  SPACING,
  LICENSE_API,
} from "../../utils/constants";

/**
 * Number of sites to show when tenant is unlicensed
 */
const UNLICENSED_SITES_LIMIT = 2;

// Styles
import {
  sitesListContainerStyles,
  emptyStateStyles,
  loadingContainerStyles,
  srOnlyStyles,
  scrollableContainerStyles,
  bottomFadeOverlayStyles,
  scrollableContainerWrapperStyles,
  searchContainerStyles,
  separatorContainerStyles,
} from "../../utils/styles";

/**
 * SitesList component - displays a searchable list of SharePoint sites
 *
 * This component renders a searchable, sortable list of SharePoint sites with the following features:
 * - Search functionality (searches title, description, and URL)
 * - Favorite sites sorting (favorites appear first, then alphabetically sorted)
 * - Highlighting of search matches
 * - Scroll position detection for fade overlay
 * - Loading and error states
 * - Refresh capability
 *
 * The component is memoized for performance optimization.
 *
 * @component
 */
export const SitesList: React.FC<ISitesListProps> = React.memo(
  ({
    sites,
    selectedSite,
    onSiteSelect,
    isLoading,
    error,
    favoriteSites = new Set<string>(),
    displayFavoriteSites,
    onToggleFavorite,
    showFullUrl = true,
    showPartialUrl = false,
    showDescription = true,
    onRefresh,
    isLicensed = true,
    isLicenseChecked = false,
  }) => {
    // Use displayFavoriteSites for sorting if provided, otherwise fall back to favoriteSites
    // Memoize to prevent recalculation on every render
    const favoriteSitesForSorting = React.useMemo((): Set<string> => {
      return displayFavoriteSites !== undefined
        ? displayFavoriteSites
        : favoriteSites;
    }, [displayFavoriteSites, favoriteSites]);

    const [searchText, setSearchText] = React.useState<string>("");
    const scrollableRef = React.useRef<HTMLDivElement>(null);
    const [showBottomFade, setShowBottomFade] = React.useState<boolean>(false);

    // Filter sites based on search text (searches title, description, and URL)
    const filteredSites = React.useMemo((): ISite[] => {
      if (!searchText.trim()) {
        return sites;
      }

      return sites.filter((site: ISite): boolean =>
        siteMatchesSearch(site, searchText)
      );
    }, [sites, searchText]);

    /**
     * Separates and sorts sites: favorites first, then regular sites
     *
     * Uses displayFavoriteSites (snapshot) for sorting to ensure consistent ordering
     * when switching between tabs. Both groups are sorted alphabetically by title.
     *
     * @returns Object containing sorted sites array and count of favorite sites
     */
    const { sortedSites, favoriteCount } = React.useMemo((): {
      sortedSites: ISite[];
      favoriteCount: number;
    } => {
      const favoriteSitesList: ISite[] = [];
      const regularSites: ISite[] = [];

      // Separate sites into favorites and regular based on snapshot
      filteredSites.forEach((site: ISite): void => {
        if (favoriteSitesForSorting.has(site.url.toLowerCase())) {
          favoriteSitesList.push(site);
        } else {
          regularSites.push(site);
        }
      });

      // Sort favorite sites alphabetically by title (case-insensitive)
      const sortedFavoriteSites: ISite[] =
        sortSitesAlphabetically(favoriteSitesList);

      // Sort regular sites alphabetically by title (case-insensitive)
      const sortedRegularSites: ISite[] = sortSitesAlphabetically(regularSites);

      return {
        sortedSites: [...sortedFavoriteSites, ...sortedRegularSites],
        favoriteCount: sortedFavoriteSites.length,
      };
    }, [filteredSites, favoriteSitesForSorting]);

    /**
     * Calculate visible sites based on license status
     *
     * - Until license check completes: show ALL sites (core functionality first)
     * - After check, if licensed: show ALL sites
     * - After check, if unlicensed: show only first 2 sites
     */
    const { visibleSites, hiddenSitesCount } = React.useMemo((): {
      visibleSites: ISite[];
      hiddenSitesCount: number;
    } => {
      // Always show all sites until license check completes (core functionality first!)
      // Also show all sites if licensed
      if (!isLicenseChecked || isLicensed) {
        return {
          visibleSites: sortedSites,
          hiddenSitesCount: 0,
        };
      }

      // After check: if unlicensed, show only first N sites
      const limitedSites = sortedSites.slice(0, UNLICENSED_SITES_LIMIT);
      return {
        visibleSites: limitedSites,
        hiddenSitesCount: Math.max(
          0,
          sortedSites.length - UNLICENSED_SITES_LIMIT
        ),
      };
    }, [sortedSites, isLicensed, isLicenseChecked]);

    // Store URL for upgrade link
    const storeUrl = LICENSE_API.BASE_URL.replace("/api", "");

    // Handle upgrade button click
    const handleUpgradeClick = React.useCallback((): void => {
      window.open(storeUrl, "_blank", "noopener,noreferrer");
    }, [storeUrl]);

    /**
     * Highlights matching text in search results using the utility function
     *
     * Wraps the pure highlightText utility function with the current searchText
     * to create a memoized callback that only changes when searchText changes.
     *
     * @param text - The text to search and highlight within
     * @returns JSX element with highlighted match wrapped in <mark> tag, or plain text if no match
     */
    const highlightText = React.useCallback(
      (text: string): React.ReactElement => {
        return highlightTextUtil(text, searchText);
      },
      [searchText]
    );

    /**
     * Checks scroll position and updates bottom fade overlay visibility
     *
     * Determines if the user has scrolled to the bottom of the list. If not at the bottom
     * and content overflows, shows a fade overlay to indicate more content below.
     *
     * Uses a threshold value to account for minor scroll position differences.
     * This function is called on scroll events and resize events to keep the fade
     * overlay state synchronized with the actual scroll position.
     *
     * Defensive checks:
     * - Validates ref exists before accessing properties
     * - Validates scroll properties are valid numbers
     * - Handles edge cases (negative values, NaN, Infinity)
     *
     * @throws Never throws - safely handles missing refs and invalid values
     */
    const checkScrollPosition = React.useCallback((): void => {
      if (!scrollableRef.current) {
        return;
      }

      const element = scrollableRef.current;
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight;
      const clientHeight = element.clientHeight;

      // Defensive checks: validate scroll properties are valid numbers
      if (
        !Number.isFinite(scrollTop) ||
        !Number.isFinite(scrollHeight) ||
        !Number.isFinite(clientHeight) ||
        scrollTop < 0 ||
        scrollHeight < 0 ||
        clientHeight < 0
      ) {
        return;
      }

      // Check if scrolled to bottom (within threshold for minor differences)
      const scrollDifference = scrollHeight - scrollTop - clientHeight;
      const isAtBottom = scrollDifference <= LAYOUT.SCROLL_THRESHOLD_PX;
      // Show fade only if not at bottom and content actually overflows
      setShowBottomFade(!isAtBottom && scrollHeight > clientHeight);
    }, []);

    // Reset scroll position when search changes
    React.useEffect((): (() => void) | void => {
      if (scrollableRef.current) {
        // Defensive check: ensure element is still valid before accessing
        const element = scrollableRef.current;
        if (element && typeof element.scrollTop === "number") {
          element.scrollTop = 0;
          // Check fade visibility after reset
          const timeoutId: ReturnType<typeof setTimeout> = setTimeout(
            checkScrollPosition,
            TIMEOUTS.IMMEDIATE
          );
          // Cleanup timeout if component unmounts or dependencies change
          return (): void => {
            clearTimeout(timeoutId);
          };
        }
      }
    }, [searchText, sortedSites.length, checkScrollPosition]);

    // Add scroll event listener to detect scroll position
    React.useEffect((): (() => void) | void => {
      const scrollableElement: HTMLDivElement | null = scrollableRef.current;
      if (!scrollableElement) {
        return;
      }

      // Initial check
      checkScrollPosition();

      // Add scroll listener
      scrollableElement.addEventListener("scroll", checkScrollPosition);

      // Also check on resize (content might change)
      const resizeObserver: ResizeObserver = new ResizeObserver((): void => {
        checkScrollPosition();
      });
      resizeObserver.observe(scrollableElement);

      // Cleanup
      return (): void => {
        scrollableElement.removeEventListener("scroll", checkScrollPosition);
        resizeObserver.disconnect();
      };
    }, [checkScrollPosition, sortedSites.length]);

    const handleSearchChange = React.useCallback(
      (
        _event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
        newValue?: string
      ): void => {
        setSearchText(newValue ?? "");
      },
      [] // Empty dependency array is intentional - this handler doesn't depend on any props or state
    );

    if (error) {
      return (
        <div style={sitesListContainerStyles}>
          <MessageBar messageBarType={MessageBarType.error}>{error}</MessageBar>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div style={sitesListContainerStyles}>
          <div
            style={loadingContainerStyles}
            role="status"
            aria-live="polite"
            aria-busy="true"
            aria-atomic="true"
          >
            <Spinner
              size={SpinnerSize.medium}
              aria-label={UI_MESSAGES.LOADING_SITES}
            />
            <span>{UI_MESSAGES.LOADING_SITES}</span>
          </div>
        </div>
      );
    }

    if (sites.length === 0) {
      return (
        <div style={sitesListContainerStyles}>
          <div
            style={emptyStateStyles}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div style={{ marginBottom: SPACING.LG }}>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 500,
                  color: CSS_VARIABLES.NEUTRAL_PRIMARY,
                  marginBottom: SPACING.SM,
                }}
              >
                {UI_MESSAGES.NO_SITES_AVAILABLE}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: CSS_VARIABLES.NEUTRAL_SECONDARY,
                  marginBottom: SPACING.XS,
                }}
              >
                {UI_MESSAGES.NO_SITES_AVAILABLE_DESCRIPTION}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: CSS_VARIABLES.NEUTRAL_TERTIARY,
                }}
              >
                {UI_MESSAGES.NO_SITES_AVAILABLE_TROUBLESHOOTING}
              </div>
            </div>
            {onRefresh && (
              <IconButton
                iconProps={{
                  iconName: "Refresh",
                }}
                title={UI_MESSAGES.REFRESH_SITES}
                ariaLabel={UI_MESSAGES.REFRESH_SITES}
                onClick={onRefresh}
                disabled={isLoading}
                className={
                  isLoading ? "helvety-spo-refresh-button-spinning" : undefined
                }
                text={UI_MESSAGES.REFRESH_SITES}
              />
            )}
          </div>
        </div>
      );
    }

    return (
      <div style={sitesListContainerStyles}>
        <div style={searchContainerStyles}>
          <div style={{ flex: 1 }}>
            <TextField
              placeholder={UI_MESSAGES.SEARCH_PLACEHOLDER}
              value={searchText}
              onChange={handleSearchChange}
              styles={{
                root: {
                  marginTop: 0,
                  marginBottom: 0,
                },
              }}
              ariaLabel={UI_MESSAGES.SEARCH_DESCRIPTION}
              aria-describedby="search-description"
              title={UI_MESSAGES.SEARCH_DESCRIPTION}
              aria-required="false"
              autoComplete="off"
              role="searchbox"
              aria-controls="helvety-spo-sites-list-container"
            />
          </div>
          {onRefresh && (
            <IconButton
              iconProps={{
                iconName: "Refresh",
              }}
              title={UI_MESSAGES.REFRESH_SITES}
              ariaLabel={UI_MESSAGES.REFRESH_SITES}
              onClick={onRefresh}
              disabled={isLoading}
              className={
                isLoading ? "helvety-spo-refresh-button-spinning" : undefined
              }
            />
          )}
        </div>
        <span id="search-description" style={srOnlyStyles}>
          {UI_MESSAGES.SEARCH_DESCRIPTION}
        </span>

        {sortedSites.length === 0 && searchText.trim() ? (
          <div
            style={emptyStateStyles}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {UI_MESSAGES.NO_SITES_FOUND} "{searchText}"
          </div>
        ) : (
          <div style={scrollableContainerWrapperStyles}>
            <div
              ref={scrollableRef}
              className="helvety-spo-sites-list-container"
              style={scrollableContainerStyles}
              role="listbox"
              aria-label={`Sites list with ${visibleSites.length} site${visibleSites.length !== 1 ? "s" : ""}${hiddenSitesCount > 0 ? ` (${hiddenSitesCount} more with license)` : ""}. Use arrow keys to navigate, Enter to select, Space to toggle favorite.`}
              aria-busy={isLoading}
              aria-live="polite"
              aria-atomic="false"
              aria-multiselectable="false"
              aria-activedescendant={selectedSite?.id}
              tabIndex={0}
            >
              {visibleSites.map((site: ISite, index: number): JSX.Element => {
                // Defensive check: validate site and index
                if (
                  !site ||
                  typeof site.id !== "string" ||
                  !Number.isInteger(index) ||
                  index < 0
                ) {
                  // Return empty fragment for invalid sites (shouldn't happen, but defensive)
                  return <React.Fragment key={`invalid-${index}`} />;
                }

                // Render separator between favorite sites and regular sites
                // Only show separator if it falls within visible sites
                // Defensive check: validate favoriteCount and index before comparison
                const shouldShowSeparator: boolean =
                  Number.isInteger(favoriteCount) &&
                  favoriteCount > 0 &&
                  Number.isInteger(index) &&
                  index === favoriteCount &&
                  index < visibleSites.length; // Only if separator would be visible

                return (
                  <React.Fragment key={site.id}>
                    {shouldShowSeparator && (
                      <div
                        style={separatorContainerStyles}
                        role="separator"
                        aria-label="Separator between favorite sites and all sites"
                        aria-orientation="horizontal"
                      >
                        <Separator />
                      </div>
                    )}
                    <SiteRow
                      site={site}
                      selectedSiteId={selectedSite?.id}
                      favoriteSites={favoriteSites}
                      onSiteSelect={onSiteSelect}
                      onToggleFavorite={onToggleFavorite}
                      highlightText={highlightText}
                      showFullUrl={showFullUrl}
                      showPartialUrl={showPartialUrl}
                      showDescription={showDescription}
                      index={index}
                      totalCount={visibleSites.length}
                    />
                  </React.Fragment>
                );
              })}

              {/* Upgrade message when sites are hidden due to licensing */}
              {hiddenSitesCount > 0 && (
                <div
                  style={{
                    padding: `${SPACING.LG} ${SPACING.MD}`,
                    textAlign: "center",
                    backgroundColor: CSS_VARIABLES.NEUTRAL_LIGHTER,
                    borderRadius: "4px",
                    marginTop: SPACING.MD,
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      color: CSS_VARIABLES.NEUTRAL_PRIMARY,
                      marginBottom: SPACING.SM,
                      fontWeight: 500,
                    }}
                  >
                    {UI_MESSAGES.LICENSE_SITES_HIDDEN.replace(
                      "{count}",
                      String(sortedSites.length)
                    )}
                  </div>
                  <PrimaryButton
                    text={UI_MESSAGES.LICENSE_UPGRADE_BUTTON}
                    onClick={handleUpgradeClick}
                    iconProps={{ iconName: "Shop" }}
                  />
                </div>
              )}
            </div>
            {showBottomFade && (
              <div style={bottomFadeOverlayStyles} aria-hidden="true" />
            )}
          </div>
        )}
      </div>
    );
  },
  compareSitesListProps
);

SitesList.displayName = "SitesList";
