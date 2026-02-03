// External dependencies
import * as React from "react";
import { Panel, PanelType } from "@fluentui/react/lib/Panel";
import { Pivot, PivotItem } from "@fluentui/react/lib/Pivot";

// Internal components
import { SitesList } from "../SitesList/SitesList";
import { SettingsContent } from "./SettingsContent";
import { AboutContent } from "./AboutContent";

// Types
import { ISitesPanelProps } from "../../types/ComponentProps";

// Constants
import { UI_MESSAGES, TIMEOUTS } from "../../utils/constants";

// Utils
import {
  querySearchInput,
  safeFocusDelayed,
  queryNavbarButton,
} from "../../utils/domUtils";

// Styles
import {
  pivotStyles,
  pivotItemContentStyles,
  srOnlyStyles,
} from "../../utils/styles";

/**
 * SitesPanel component - displays a panel with tabs for Sites, Settings, and About
 *
 * This component renders a side panel that slides in from the left, containing three tabs:
 * - Sites: Displays the searchable sites list with favorites, search, and refresh functionality
 * - Settings: Displays user preference settings for customizing the site explorer
 * - About: Displays app description, contact, license info, version and build date
 *
 * The panel manages favorite sites snapshots to ensure consistent sorting when switching
 * between tabs. The snapshot is updated when the panel opens or when switching to the Sites tab.
 *
 * Accessibility features:
 * - Focus management when panel opens/closes
 * - Keyboard navigation support
 * - ARIA labels and descriptions
 * - Screen reader announcements
 *
 * @component
 * @param props - Component props containing sites data, callbacks, and settings
 *
 * @example
 * ```tsx
 * <SitesPanel
 *   isOpen={isPanelOpen}
 *   onDismiss={handleClosePanel}
 *   sites={sites}
 *   selectedSite={selectedSite}
 *   onSiteSelect={handleSiteSelect}
 *   favoriteSites={favoriteSites}
 *   onToggleFavorite={handleToggleFavorite}
 *   settings={settings}
 *   onSettingsChange={handleSettingsChange}
 * />
 * ```
 */
/**
 * Custom comparison function for SitesPanel React.memo
 *
 * Optimizes re-renders by comparing props strategically:
 * - Primitives (isOpen, booleans, strings) - value comparison
 * - Objects (sites, selectedSite, settings) - reference or ID comparison
 * - Callbacks - reference comparison
 * - Sets - reference comparison
 *
 * @param prevProps - Previous component props
 * @param nextProps - Next component props
 * @returns true if props are equal (skip re-render), false if different (re-render)
 */
function compareSitesPanelProps(
  prevProps: ISitesPanelProps,
  nextProps: ISitesPanelProps
): boolean {
  // Fast path: reference equality for callbacks
  if (
    prevProps.onDismiss !== nextProps.onDismiss ||
    prevProps.onSiteSelect !== nextProps.onSiteSelect ||
    prevProps.onToggleFavorite !== nextProps.onToggleFavorite ||
    prevProps.onSettingsChange !== nextProps.onSettingsChange ||
    prevProps.onRefresh !== nextProps.onRefresh
  ) {
    return false;
  }

  // Compare primitives (cheap comparisons)
  if (
    prevProps.isOpen !== nextProps.isOpen ||
    prevProps.isLoading !== nextProps.isLoading ||
    prevProps.error !== nextProps.error ||
    prevProps.showFullUrl !== nextProps.showFullUrl ||
    prevProps.showPartialUrl !== nextProps.showPartialUrl ||
    prevProps.showDescription !== nextProps.showDescription ||
    prevProps.isLicensed !== nextProps.isLicensed ||
    prevProps.isLicenseChecked !== nextProps.isLicenseChecked ||
    prevProps.licenseTier !== nextProps.licenseTier ||
    prevProps.tenantId !== nextProps.tenantId
  ) {
    return false;
  }

  // Compare selected site by ID (cheap string comparison)
  if (prevProps.selectedSite?.id !== nextProps.selectedSite?.id) {
    return false;
  }

  // Compare Sets by reference (very fast)
  // Note: displayFavoriteSites is computed internally, not a prop, so we don't compare it here
  if (prevProps.favoriteSites !== nextProps.favoriteSites) {
    return false;
  }

  // Compare settings object by reference (settings object is stable)
  if (prevProps.settings !== nextProps.settings) {
    return false;
  }

  // Compare sites array by reference (if same reference, skip deep comparison)
  if (prevProps.sites === nextProps.sites) {
    return true;
  }

  // If sites array changed, check length first (cheap)
  if (prevProps.sites.length !== nextProps.sites.length) {
    return false;
  }

  // If lengths match, check first and last items (strategic sampling)
  const sitesLength = prevProps.sites.length;
  if (sitesLength > 0) {
    if (prevProps.sites[0]?.id !== nextProps.sites[0]?.id) {
      return false;
    }
    if (
      sitesLength > 1 &&
      prevProps.sites[sitesLength - 1]?.id !==
        nextProps.sites[sitesLength - 1]?.id
    ) {
      return false;
    }
  }

  return true;
}

export const SitesPanel: React.FC<ISitesPanelProps> = React.memo(
  ({
    isOpen,
    onDismiss,
    sites,
    selectedSite,
    onSiteSelect,
    isLoading,
    error,
    favoriteSites = new Set<string>(),
    onToggleFavorite,
    settings,
    onSettingsChange,
    showFullUrl = true,
    showPartialUrl = false,
    showDescription = true,
    onRefresh,
    isLicensed = true,
    isLicenseChecked = false,
    licenseTier,
    tenantId,
  }) => {
    const [selectedKey, setSelectedKey] = React.useState<string>(
      UI_MESSAGES.SITES_TAB
    );
    const prevIsOpenRef = React.useRef<boolean>(isOpen);
    const prevSelectedKeyRef = React.useRef<string>(selectedKey);
    const favoriteSitesSnapshotRef = React.useRef<Set<string>>(
      new Set(favoriteSites)
    );

    const contentContainerRef = React.useRef<HTMLDivElement>(null);

    // Snapshot of favorite sites (URLs) for sorting - only updates when panel opens or Sites tab is selected
    //
    // Why use a snapshot?
    // - When switching between Sites and Settings tabs, we want consistent sorting
    // - Without snapshot: if user favorites a site while on Settings tab, then switches to Sites tab,
    //   the site would jump to top, causing UI flicker
    // - With snapshot: favorites are captured when panel opens or Sites tab is selected,
    //   ensuring stable sorting until next snapshot update
    //
    // Implementation details:
    // - Uses refs to track previous state without causing re-renders
    // - Snapshot updates only when: (1) panel just opened, or (2) user switched to Sites tab, or (3) favorites changed
    // - This ensures favorites list remains stable while browsing Settings
    // - We track favoriteSites.size separately to detect changes without deep Set comparison (performance optimization)
    const favoriteSitesSizeRef = React.useRef<number>(favoriteSites.size);
    const favoriteSitesSize = favoriteSites.size;

    const displayFavoriteSites = React.useMemo((): Set<string> => {
      // Detection logic for when to update the snapshot:

      // 1. Detect if panel transitioned from closed to open
      //    This ensures we capture the current favorites state when user first opens the panel
      const panelJustOpened: boolean = !prevIsOpenRef.current && isOpen;

      // 2. Detect if user switched from Settings tab to Sites tab (while panel is open)
      //    This captures favorites when user returns to Sites tab, ensuring they see current favorites
      //    but with stable sorting (won't jump around while they were on Settings tab)
      const switchedToSitesTab: boolean =
        prevSelectedKeyRef.current !== UI_MESSAGES.SITES_TAB &&
        selectedKey === UI_MESSAGES.SITES_TAB &&
        isOpen;

      // 3. Detect if favorites changed (size changed indicates additions/removals)
      //    We use size comparison instead of Set reference comparison for performance
      //    This allows us to update snapshot when favorites change, but only when necessary
      const favoritesChanged: boolean =
        favoriteSitesSizeRef.current !== favoriteSitesSize;

      // Update snapshot only at specific moments to ensure stable sorting
      // We create a new Set (not reference to original) to ensure immutability
      if (panelJustOpened || switchedToSitesTab || favoritesChanged) {
        // Create new Set to capture current favorites state
        // This creates a snapshot that won't change even if favoriteSites prop changes
        favoriteSitesSnapshotRef.current = new Set(favoriteSites);
        // Update size ref for next comparison
        favoriteSitesSizeRef.current = favoriteSitesSize;
      }

      // Update refs for next comparison (these don't trigger re-renders)
      // These refs are used in the next render cycle to detect state transitions
      prevIsOpenRef.current = isOpen;
      prevSelectedKeyRef.current = selectedKey;

      // Return the snapshot (stable reference unless snapshot was updated above)
      // This Set reference remains stable between renders unless one of the update conditions was met
      return favoriteSitesSnapshotRef.current;
    }, [isOpen, selectedKey, favoriteSites, favoriteSitesSize]);

    // Focus management: focus search input when panel opens or Sites tab is selected
    // This improves accessibility by ensuring keyboard users can immediately interact with the search
    React.useEffect((): (() => void) | void => {
      if (!isOpen || selectedKey !== UI_MESSAGES.SITES_TAB) {
        return;
      }

      // Query for search input using type-safe utility
      const searchInput: HTMLInputElement | null = querySearchInput();

      if (searchInput) {
        // Small delay to ensure panel is fully rendered and accessible
        // Use safeFocusDelayed for better error handling and recovery
        const cancelFocus: (() => void) | undefined = safeFocusDelayed(
          searchInput,
          TIMEOUTS.FOCUS_DELAY_MEDIUM_MS,
          "Focusing search input after panel opens"
        );

        // Return cleanup function to cancel delayed focus if component unmounts
        return cancelFocus ?? undefined;
      }

      // No cleanup needed if search input not found
      return undefined;
    }, [isOpen, selectedKey]);

    const handleLinkClick = React.useCallback((item?: PivotItem): void => {
      if (item?.props.headerText) {
        setSelectedKey(item.props.headerText);
      }
    }, []); // Empty dependency array is intentional - this handler doesn't depend on any props or state

    // Handle refresh - updates favorite sites snapshot and calls refresh callback
    const handleRefresh = React.useCallback((): void => {
      // Update favorite sites snapshot to reflect current favorite sites state
      // This ensures newly favorited sites move to the top immediately
      favoriteSitesSnapshotRef.current = new Set(favoriteSites);
      // Call the refresh callback to fetch fresh data
      if (onRefresh) {
        onRefresh();
      }
    }, [favoriteSites, onRefresh]);

    // Handle panel dismiss with focus management
    // Returns focus to the button that opened the panel for better keyboard navigation
    const handleDismiss = React.useCallback((): void => {
      // Query for navbar button using type-safe utility
      const navbarButton: HTMLElement | null = queryNavbarButton();

      if (navbarButton) {
        // Small delay to ensure panel is fully closed before focusing
        // Use safeFocusDelayed for better error handling and recovery
        safeFocusDelayed(
          navbarButton,
          TIMEOUTS.FOCUS_DELAY_SHORT_MS,
          "Returning focus to navbar button after panel closes"
        );
      }

      // Always call onDismiss, even if focus operation fails
      onDismiss();
    }, [onDismiss]);

    return (
      <Panel
        isOpen={isOpen}
        onDismiss={handleDismiss}
        headerText={UI_MESSAGES.SITES_YOU_HAVE_ACCESS_TO}
        closeButtonAriaLabel={UI_MESSAGES.CLOSE_PANEL}
        type={PanelType.medium}
        isLightDismiss={true}
        className="helvety-spo-sites-panel"
        id="helvety-spo-sites-panel"
        aria-label={UI_MESSAGES.SITES_PANEL}
        aria-describedby="sites-panel-description"
        aria-expanded={isOpen}
        styles={{
          root: {
            left: 0,
            right: "auto",
          },
          main: {
            left: 0,
            right: "auto",
          },
        }}
      >
        <span id="sites-panel-description" style={srOnlyStyles}>
          Panel containing tabs for browsing sites, settings, and about
        </span>
        <div
          ref={contentContainerRef}
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <div>
            <Pivot
              styles={pivotStyles}
              onLinkClick={handleLinkClick}
              selectedKey={selectedKey}
              aria-label="Sites panel navigation"
            >
              <PivotItem
                headerText={UI_MESSAGES.SITES_TAB}
                itemKey={UI_MESSAGES.SITES_TAB}
              >
                <div style={pivotItemContentStyles}>
                  <SitesList
                    sites={sites}
                    selectedSite={selectedSite}
                    onSiteSelect={onSiteSelect}
                    isLoading={isLoading}
                    error={error}
                    favoriteSites={favoriteSites}
                    displayFavoriteSites={displayFavoriteSites}
                    onToggleFavorite={onToggleFavorite}
                    showFullUrl={showFullUrl}
                    showPartialUrl={showPartialUrl}
                    showDescription={showDescription}
                    onRefresh={handleRefresh}
                    isLicensed={isLicensed}
                    isLicenseChecked={isLicenseChecked}
                  />
                </div>
              </PivotItem>
              <PivotItem
                headerText={UI_MESSAGES.SETTINGS_TAB}
                itemKey={UI_MESSAGES.SETTINGS_TAB}
              >
                <SettingsContent
                  settings={settings}
                  onSettingsChange={onSettingsChange}
                />
              </PivotItem>
              <PivotItem
                headerText={UI_MESSAGES.ABOUT_TAB}
                itemKey={UI_MESSAGES.ABOUT_TAB}
              >
                <AboutContent
                  licenseTier={licenseTier}
                  tenantId={tenantId}
                />
              </PivotItem>
            </Pivot>
          </div>
        </div>
      </Panel>
    );
  },
  compareSitesPanelProps
);

SitesPanel.displayName = "SitesPanel";
