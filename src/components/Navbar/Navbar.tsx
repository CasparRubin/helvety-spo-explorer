// External dependencies
import * as React from "react";
import { DefaultButton } from '@fluentui/react/lib/Button';
import { IContextualMenuItem, ContextualMenuItemType } from '@fluentui/react/lib/ContextualMenu';

// Internal components
import { SitesPanel } from "../SitesPanel/SitesPanel";

// Types
import { INavbarProps } from "../../types/ComponentProps";
import { ISite } from "../../types/Site";
import { IUserSettings } from "../../services/SettingsService";

// Utils and hooks
import { useSites } from '../../utils/customHooks/useSites';
import { useFavorites } from '../../utils/customHooks/useFavorites';
import { useSettings } from '../../utils/customHooks/useSettings';
import { sortSitesAlphabetically } from '../../utils/siteUtils';

// Constants
import { DEFAULT_USER_ID, UI_MESSAGES } from '../../utils/constants';

// Styles
import { navbarStyles, navbarInnerStyles, navbarContentStyles, sitesButtonStyles, srOnlyStyles } from '../../utils/styles';

/**
 * Navbar component - main navigation bar for SharePoint sites
 * 
 * Provides a navigation bar with access to SharePoint sites and favorites.
 * This component serves as the main entry point for the site explorer functionality.
 * 
 * Features:
 * - Displays a button to open the sites panel
 * - Shows a dropdown menu with favorite sites for quick access
 * - Manages site fetching, favorites, and settings
 * - Handles error states and loading indicators
 * 
 * @component
 * @param props - Component props containing the SharePoint context
 * 
 * @example
 * ```tsx
 * <Navbar context={applicationCustomizerContext} />
 * ```
 */
export const Navbar: React.FC<INavbarProps> = React.memo(({ context }) => {
  const userId = context.pageContext.user.loginName || DEFAULT_USER_ID;
  const [isPanelOpen, setIsPanelOpen] = React.useState<boolean>(false);

  // Use custom hooks for sites, favorites, and settings
  const { sites, selectedSite, isLoading, error, refresh: refreshSites, selectSite, navigateToSite } = useSites(context);
  const { favoriteSites, toggleFavorite, refreshFavorites } = useFavorites(userId);
  const { settings, updateSettings } = useSettings(userId);

  // Handle refresh - clears cache and re-fetches sites and favorites
  const handleRefresh = React.useCallback(async (): Promise<void> => {
    refreshFavorites();
    await refreshSites();
  }, [refreshFavorites, refreshSites]);

  const handleSiteSelect = React.useCallback((site: ISite): void => {
    selectSite(site);
    if (site.url) {
      // Use current settings value from state to ensure we have the latest preference
      navigateToSite(site.url, settings.openInNewTab);
    }
  }, [selectSite, navigateToSite, settings.openInNewTab]);

  const handleToggleFavorite = React.useCallback((siteUrl: string): void => {
    toggleFavorite(siteUrl);
  }, [toggleFavorite]);

  const handleSettingsChange = React.useCallback((newSettings: IUserSettings): void => {
    updateSettings(newSettings);
  }, [updateSettings]);

  const handleOpenPanel = React.useCallback(() => {
    setIsPanelOpen(true);
  }, []);

  const handleClosePanel = React.useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  // Get favorite sites for menu (sorted alphabetically)
  const favoriteSitesList = React.useMemo(() => {
    if (favoriteSites.size === 0) {
      return [];
    }
    const favoriteList = sites.filter(site => favoriteSites.has(site.url.toLowerCase()));
    // Sort alphabetically by title (case-insensitive)
    return sortSitesAlphabetically(favoriteList);
  }, [sites, favoriteSites]);

  // Build menu items for split button dropdown
  const menuItems = React.useMemo((): IContextualMenuItem[] => {
    const items: IContextualMenuItem[] = [];

    // Add favorite sites header
    items.push({
      key: 'favorites-header',
      text: UI_MESSAGES.FAVORITES,
      itemType: ContextualMenuItemType.Header,
    });

    // Add favorite sites or empty state message
    if (favoriteSitesList.length > 0) {
      favoriteSitesList.forEach((site) => {
        items.push({
          key: site.id,
          text: site.title,
          iconProps: { iconName: 'FavoriteStarFill' },
          onClick: () => {
            handleSiteSelect(site);
          },
        });
      });
    } else {
      items.push({
        key: 'no-favorites',
        text: UI_MESSAGES.ADD_TO_FAVORITES_HINT,
        disabled: true,
        iconProps: { iconName: 'Info' },
      });
    }

    return items;
  }, [favoriteSitesList, handleSiteSelect]);

  return (
    <div
      className="helvety-spo-navbar"
      style={navbarStyles}
      role="navigation"
      aria-label="Site navigation"
    >
      <div style={navbarInnerStyles}>
        <div style={navbarContentStyles}>
          <DefaultButton
            text={UI_MESSAGES.SITES_YOU_HAVE_ACCESS_TO}
            iconProps={{ iconName: 'SecondaryNav' }}
            onClick={handleOpenPanel}
            split={true}
            menuProps={{
              items: menuItems,
              ariaLabel: UI_MESSAGES.FAVORITES_QUICK_ACCESS_MENU,
            }}
            styles={sitesButtonStyles}
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
      />
    </div>
  );
});

Navbar.displayName = 'Navbar';
