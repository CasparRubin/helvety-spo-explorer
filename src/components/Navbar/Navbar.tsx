// External dependencies
import * as React from "react";
import { DefaultButton, PrimaryButton } from "@fluentui/react/lib/Button";
import {
  IContextualMenuItem,
  ContextualMenuItemType,
} from "@fluentui/react/lib/ContextualMenu";

// Internal components
import { SitesPanel } from "../SitesPanel/SitesPanel";

// Types
import { INavbarProps } from "../../types/ComponentProps";
import { ISite } from "../../types/Site";
import { IUserSettings } from "../../services/SettingsService";

// Utils and hooks
import { useSites } from "../../utils/customHooks/useSites";
import { useFavorites } from "../../utils/customHooks/useFavorites";
import { useSettings } from "../../utils/customHooks/useSettings";
import { useLicense } from "../../utils/customHooks/useLicense";
import { sortSitesAlphabetically } from "../../utils/siteUtils";
import { logError, logInfo } from "../../utils/errorUtils";

// Constants
import {
  DEFAULT_USER_ID,
  UI_MESSAGES,
  LICENSE_API,
} from "../../utils/constants";

// Styles
import {
  navbarStyles,
  navbarInnerStyles,
  navbarContentStyles,
  srOnlyStyles,
} from "../../utils/styles";

/**
 * Navbar component - main navigation bar for SharePoint sites
 *
 * Provides a navigation bar with access to SharePoint sites and favorites.
 * This component serves as the main entry point for the site explorer functionality.
 *
 * Features:
 * - Displays a button to open the sites panel (hidden when unlicensed)
 * - Shows a dropdown menu with favorite sites for quick access
 * - Manages site fetching, favorites, and settings
 * - Handles error states and loading indicators
 * - Shows full-width warning banner when unlicensed with link to store
 *
 * @component
 * @param props - Component props containing the SharePoint context
 *
 * @example
 * ```tsx
 * <Navbar context={applicationCustomizerContext} />
 * ```
 */
/**
 * Custom comparison function for Navbar React.memo
 *
 * Optimizes re-renders by comparing only the essential context properties
 * that affect the component's behavior, rather than the entire context object.
 *
 * @param prevProps - Previous component props
 * @param nextProps - Next component props
 * @returns true if props are equal (skip re-render), false if different (re-render)
 */
function compareNavbarProps(
  prevProps: INavbarProps,
  nextProps: INavbarProps
): boolean {
  // Compare only the essential context properties that affect component behavior
  const prevUser = prevProps.context.pageContext.user;
  const nextUser = nextProps.context.pageContext.user;

  // Only re-render if user login name changes (affects userId)
  return prevUser.loginName === nextUser.loginName;
}

export const Navbar: React.FC<INavbarProps> = React.memo(({ context }) => {
  // Memoize userId to avoid recalculation on every render
  const userId = React.useMemo((): string => {
    return context.pageContext.user.loginName || DEFAULT_USER_ID;
  }, [context.pageContext.user.loginName]);

  const [isPanelOpen, setIsPanelOpen] = React.useState<boolean>(false);

  // Use custom hooks for sites, favorites, settings, and license
  // Sites load first (core functionality), license check runs in background
  const {
    sites,
    selectedSite,
    isLoading,
    error,
    refresh: refreshSites,
    selectSite,
    navigateToSite,
  } = useSites(context);
  const { favoriteSites, toggleFavorite, refreshFavorites } =
    useFavorites(userId);
  const { settings, updateSettings } = useSettings(userId);
  const { license, tenantId } = useLicense(context);

  // Log license status for debugging (only when check completes)
  React.useEffect((): void => {
    if (license.isChecked) {
      logInfo(
        "Navbar",
        `License check complete: ${license.isValid ? "VALID" : "INVALID"}`,
        `Tenant: ${tenantId || "unknown"}, Tier: ${license.tier || "none"}`
      );
    }
  }, [license.isChecked, license.isValid, license.tier, tenantId]);

  // Determine the store URL for licensing
  const storeUrl = LICENSE_API.BASE_URL.replace("/api", "");

  // Handle "Get License" button click
  const handleGetLicense = React.useCallback((): void => {
    window.open(storeUrl, "_blank", "noopener,noreferrer");
  }, [storeUrl]);

  // Handle refresh - clears cache and re-fetches sites and favorites
  // Optimized: use stable references, avoid unnecessary dependencies
  // Includes error handling to prevent unhandled promise rejections
  const handleRefresh = React.useCallback(async (): Promise<void> => {
    try {
      refreshFavorites();
      await refreshSites();
    } catch (error: unknown) {
      // refreshSites already handles errors internally via withErrorBoundary
      // This catch serves as a final safety net for unexpected promise rejections
      // Log error but don't break the UI - errors are already handled by hooks
      logError(
        "Navbar",
        error,
        "Error in handleRefresh - this should not happen as errors are handled by hooks"
      );
    }
  }, [refreshFavorites, refreshSites]);

  // Handle site selection - uses current settings value to ensure latest preference
  const handleSiteSelect = React.useCallback(
    (site: ISite): void => {
      selectSite(site);
      if (site.url) {
        // Access settings.openInNewTab directly to ensure we have the latest preference
        navigateToSite(site.url, settings.openInNewTab);
      }
    },
    [selectSite, navigateToSite, settings.openInNewTab]
  );

  const handleToggleFavorite = React.useCallback(
    (siteUrl: string): void => {
      toggleFavorite(siteUrl);
    },
    [toggleFavorite]
  );

  const handleSettingsChange = React.useCallback(
    (newSettings: IUserSettings): void => {
      updateSettings(newSettings);
    },
    [updateSettings]
  );

  const handleOpenPanel = React.useCallback((): void => {
    setIsPanelOpen(true);
  }, []);

  const handleClosePanel = React.useCallback((): void => {
    setIsPanelOpen(false);
  }, []);

  // Get favorite sites for menu (sorted alphabetically)
  // Optimized: Early return for empty favorites, memoized to avoid recalculation
  // Use sites.length and favoriteSites.size as dependencies to avoid deep comparison
  const favoriteSitesList = React.useMemo((): ISite[] => {
    if (favoriteSites.size === 0 || sites.length === 0) {
      return [];
    }

    // Pre-compute lowercase URLs for efficient Set lookup
    const favoriteList = sites.filter((site: ISite): boolean => {
      if (!site.url) {
        return false;
      }
      return favoriteSites.has(site.url.toLowerCase());
    });

    // Sort alphabetically by title (case-insensitive)
    return sortSitesAlphabetically(favoriteList);
  }, [sites, favoriteSites.size]); // Use size instead of Set reference to reduce re-renders

  // Build menu items for split button dropdown
  const menuItems = React.useMemo((): IContextualMenuItem[] => {
    const items: IContextualMenuItem[] = [];

    // Add favorite sites header
    items.push({
      key: "favorites-header",
      text: UI_MESSAGES.FAVORITES,
      itemType: ContextualMenuItemType.Header,
    });

    // Add favorite sites or empty state message
    if (favoriteSitesList.length > 0) {
      favoriteSitesList.forEach((site) => {
        items.push({
          key: site.id,
          text: site.title,
          iconProps: { iconName: "FavoriteStarFill" },
          onClick: () => {
            handleSiteSelect(site);
          },
        });
      });
    } else {
      items.push({
        key: "no-favorites",
        text: UI_MESSAGES.ADD_TO_FAVORITES_HINT,
        disabled: true,
        iconProps: { iconName: "Info" },
      });
    }

    return items;
  }, [favoriteSitesList, handleSiteSelect]);

  // Show unlicensed banner only after check completes AND license is invalid
  // This ensures core functionality is never blocked
  const showUnlicensedBanner = license.isChecked && !license.isValid;

  return (
    <div
      className="helvety-spo-navbar"
      style={navbarStyles}
      role="navigation"
      aria-label="Site navigation"
    >
      {/* Unlicensed Product banner - permanent, non-dismissable, full-width */}
      {showUnlicensedBanner && (
        <div
          style={{
            backgroundColor: "#FFF4CE",
            padding: "8px 16px",
            marginLeft: "-16px",
            marginRight: "-16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: "12px",
            width: "calc(100% + 32px)",
            boxSizing: "border-box",
          }}
        >
          <span style={{ fontWeight: 600 }}>
            {UI_MESSAGES.LICENSE_BANNER_UNLICENSED}
          </span>
          <PrimaryButton
            text={UI_MESSAGES.LICENSE_BANNER_GET_LICENSE}
            onClick={handleGetLicense}
            iconProps={{ iconName: "Shop" }}
          />
        </div>
      )}
      {/* Sites button - hidden when unlicensed */}
      {!showUnlicensedBanner && (
        <div style={navbarInnerStyles}>
          <div style={navbarContentStyles}>
            <DefaultButton
              text={UI_MESSAGES.SITES_YOU_HAVE_ACCESS_TO}
              iconProps={{ iconName: "SecondaryNav" }}
              onClick={handleOpenPanel}
              split={true}
              menuProps={{
                items: menuItems,
                ariaLabel: UI_MESSAGES.FAVORITES_QUICK_ACCESS_MENU,
              }}
              ariaLabel={UI_MESSAGES.OPEN_SITES_PANEL}
              aria-describedby="sites-button-description"
              aria-expanded={isPanelOpen}
              aria-controls="helvety-spo-sites-panel"
              title={UI_MESSAGES.OPEN_SITES_PANEL_DESCRIPTION}
            />
            <span id="sites-button-description" style={srOnlyStyles}>
              {UI_MESSAGES.OPEN_SITES_PANEL_DESCRIPTION}
            </span>
          </div>
        </div>
      )}
      <SitesPanel
        isOpen={isPanelOpen}
        onDismiss={handleClosePanel}
        sites={sites}
        selectedSite={selectedSite}
        onSiteSelect={handleSiteSelect}
        isLoading={isLoading}
        error={error}
        favoriteSites={favoriteSites}
        onToggleFavorite={handleToggleFavorite}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        showFullUrl={settings.showFullUrl}
        showPartialUrl={settings.showPartialUrl}
        showDescription={settings.showDescription}
        onRefresh={handleRefresh}
        isLicensed={license.isValid}
        isLicenseChecked={license.isChecked}
      />
    </div>
  );
}, compareNavbarProps);

Navbar.displayName = "Navbar";
