import * as React from 'react';
import { ApplicationCustomizerContext } from '@microsoft/sp-application-base';
import { SiteService } from '../../services/SiteService';
import { ISite } from '../../types/Site';
import { logError, extractErrorMessage } from '../errorUtils';
import { navigateToSite as navigateToSiteUtil } from '../navigationUtils';

const LOG_SOURCE = 'useSites';

/**
 * Return type for useSites hook
 */
export interface IUseSitesReturn {
  /** Array of sites */
  sites: ISite[];
  /** Currently selected site */
  selectedSite: ISite | undefined;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | undefined;
  /** Function to refresh sites */
  refresh: () => Promise<void>;
  /** Function to select a site */
  selectSite: (site: ISite) => void;
  /** Function to navigate to a site */
  navigateToSite: (url: string, openInNewTab?: boolean) => void;
}

/**
 * Custom hook for managing site fetching and selection
 * 
 * This hook encapsulates all site-related logic including:
 * - Fetching sites from the API
 * - Managing loading and error states
 * - Selecting the current site
 * - Refreshing sites
 * 
 * @param context - SharePoint application customizer context
 * @returns Object containing sites, selectedSite, loading state, error, and handlers
 * 
 * @example
 * ```typescript
 * const { sites, selectedSite, isLoading, error, refresh, selectSite } = useSites(context);
 * ```
 */
export function useSites(context: ApplicationCustomizerContext): IUseSitesReturn {
  const [sites, setSites] = React.useState<ISite[]>([]);
  const [selectedSite, setSelectedSite] = React.useState<ISite | undefined>();
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | undefined>();
  const siteServiceRef = React.useRef<SiteService | null>(null);

  // Initialize site service
  React.useEffect((): void => {
    try {
      siteServiceRef.current = new SiteService(context);
    } catch (err: unknown) {
      logError(LOG_SOURCE, err, 'Error initializing SiteService');
    }
  }, [context]);

  // Fetch sites function - reusable for both initial load and refresh
  const fetchSites = React.useCallback(async (): Promise<void> => {
    if (!siteServiceRef.current) {
      const errorMessage: string = 'SiteService not initialized';
      logError(LOG_SOURCE, new Error(errorMessage), 'fetchSites - service not available');
      setError(errorMessage);
      setIsLoading(false);
      return;
    }

    // Batch loading and error state updates
    setIsLoading(true);
    setError(undefined);

    try {
      const fetchedSites: ISite[] = await siteServiceRef.current.getSites();
      
      // Validate fetched sites is an array
      if (!Array.isArray(fetchedSites)) {
        const errorMessage: string = 'Invalid sites data received from API';
        logError(LOG_SOURCE, new Error(errorMessage), 'fetchSites - invalid response format');
        setError(errorMessage);
        setSites([]);
        return;
      }
      
      // Set current site as selected using functional update to avoid stale closure
      const currentWebUrl: string = context.pageContext.web.absoluteUrl.toLowerCase();
      const currentSite: ISite | undefined = fetchedSites.find(
        (site: ISite): boolean => 
          typeof site.url === 'string' && 
          site.url.toLowerCase() === currentWebUrl
      );
      
      // Update sites and selectedSite together to minimize re-renders
      setSites(fetchedSites);
      setSelectedSite((prevSelected: ISite | undefined): ISite | undefined => {
        // Only update if the current site changed or wasn't set before
        if (currentSite) {
          // Use reference equality if possible, otherwise check ID
          return prevSelected?.id === currentSite.id ? prevSelected : currentSite;
        }
        // Keep previous selection if current site not found
        return prevSelected;
      });
    } catch (err: unknown) {
      const errorMessage: string = extractErrorMessage(err);
      logError(LOG_SOURCE, err, 'Error fetching sites from API');
      setError(errorMessage);
      // Clear sites on error to prevent showing stale data
      setSites([]);
      setSelectedSite(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  // Fetch sites on mount
  React.useEffect((): void => {
    // fetchSites already handles errors internally, but we add a catch as a safety net
    fetchSites().catch((err: unknown): void => {
      // This should rarely happen since fetchSites has internal error handling
      // but serves as a final safety net for any unexpected promise rejections
      logError(LOG_SOURCE, err, 'Unhandled promise rejection in fetchSites');
    });
  }, [fetchSites]);

  // Refresh function that clears cache and re-fetches
  const refresh = React.useCallback(async (): Promise<void> => {
    try {
      if (siteServiceRef.current) {
        siteServiceRef.current.clearCache();
      }
      await fetchSites();
    } catch (err: unknown) {
      // fetchSites already handles errors internally, but log here for additional context
      logError(LOG_SOURCE, err, 'Error refreshing sites');
      // Re-throw to allow caller to handle if needed
      throw err;
    }
  }, [fetchSites]);

  // Select site function - optimized to avoid unnecessary updates
  const selectSite = React.useCallback((site: ISite): void => {
    // Validate site parameter
    if (!site || typeof site !== 'object' || !site.id) {
      logError(LOG_SOURCE, new Error('Invalid site provided to selectSite'), `Site: ${JSON.stringify(site)}`);
      return;
    }
    
    setSelectedSite((prevSelected: ISite | undefined): ISite | undefined => {
      // Only update if selection actually changed
      return prevSelected?.id === site.id ? prevSelected : site;
    });
  }, []);

  // Navigate to site function
  const navigateToSite = React.useCallback((url: string, openInNewTab?: boolean): void => {
    // Validate URL parameter
    if (!url || typeof url !== 'string') {
      logError(LOG_SOURCE, new Error('Invalid URL provided to navigateToSite'), `URL: ${String(url)}`);
      return;
    }
    
    try {
      navigateToSiteUtil(url, openInNewTab);
    } catch (err: unknown) {
      logError(LOG_SOURCE, err, `Error navigating to site: ${url}`);
    }
  }, []);

  return {
    sites,
    selectedSite,
    isLoading,
    error,
    refresh,
    selectSite,
    navigateToSite,
  };
}
