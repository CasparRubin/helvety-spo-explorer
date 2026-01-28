import * as React from 'react';
import { ApplicationCustomizerContext } from '@microsoft/sp-application-base';
import { SiteService } from '../../services/SiteService';
import { ISite } from '../../types/Site';
import { logError, extractErrorMessage } from '../errorUtils';
import { navigateToSite as navigateToSiteUtil } from '../navigationUtils';
import { isValidSitesArray, isValidSite, isNonEmptyString } from '../validationUtils';
import { safeExecuteSync, withErrorBoundary } from '../errorHandlingUtils';

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

  // Store context in ref to avoid dependency on context object (which may change reference)
  const contextRef = React.useRef<ApplicationCustomizerContext>(context);
  React.useEffect((): void => {
    contextRef.current = context;
  }, [context]);

  // Initialize site service
  // Use contextRef to track context changes and reinitialize service if needed
  React.useEffect((): void => {
    try {
      siteServiceRef.current = new SiteService(contextRef.current);
    } catch (err: unknown) {
      logError(LOG_SOURCE, err, 'Error initializing SiteService - sites will not be available');
      // Set error state so UI can handle gracefully
      setError('Failed to initialize site service');
      setIsLoading(false);
    }
  }, [context]); // Keep context dependency to reinitialize if context changes

  // Fetch sites function - reusable for both initial load and refresh
  // Use contextRef to avoid dependency on context object
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

    // Use error boundary wrapper for consistent error handling
    await withErrorBoundary(
      async (): Promise<void> => {
        const fetchedSites: ISite[] = await siteServiceRef.current!.getSites();
        
        // Validate fetched sites is a valid sites array
        if (!isValidSitesArray(fetchedSites)) {
          const errorMessage: string = 'Invalid sites data received from API';
          logError(LOG_SOURCE, new Error(errorMessage), 'fetchSites - invalid response format');
          setError(errorMessage);
          setSites([]);
          return;
        }
        
        // Set current site as selected using functional update to avoid stale closure
        // Use contextRef to get latest context without dependency
        const currentWebUrl: string = contextRef.current.pageContext.web.absoluteUrl.toLowerCase();
        const currentSite: ISite | undefined = fetchedSites.find(
          (site: ISite): boolean => 
            isValidSite(site) &&
            typeof site.url === 'string' && 
            site.url.length > 0 &&
            site.url.toLowerCase() === currentWebUrl
        );
        
        // Update sites and selectedSite together to minimize re-renders
        setSites(fetchedSites);
        setSelectedSite((prevSelected: ISite | undefined): ISite | undefined => {
          // Only update if the current site changed or wasn't set before
          if (currentSite && isValidSite(currentSite)) {
            // Use reference equality if possible, otherwise check ID
            return prevSelected?.id === currentSite.id ? prevSelected : currentSite;
          }
          // Keep previous selection if current site not found
          return prevSelected;
        });
      },
      (err: unknown): void => {
        const errorMessage: string = extractErrorMessage(err);
        logError(LOG_SOURCE, err, 'Error fetching sites from API');
        setError(errorMessage);
        // Clear sites on error to prevent showing stale data
        setSites([]);
        setSelectedSite(undefined);
      },
      undefined // No default value - let error handler manage state
    );
    
    setIsLoading(false);
  }, []); // Empty deps - use contextRef to access latest context

  // Fetch sites on mount - delay significantly to ensure page is fully loaded and not blocking
  React.useEffect((): (() => void) => {
    // Delay API call significantly to prevent blocking page load
    // Wait for page to be fully interactive before making API calls
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    
    const startFetch = (): void => {
      timeoutId = setTimeout((): void => {
        // fetchSites already handles errors internally via withErrorBoundary
        // This catch serves as a final safety net for unexpected promise rejections
        // Using void operator to explicitly mark intentional fire-and-forget pattern
        // eslint-disable-next-line no-void -- void operator required to satisfy @typescript-eslint/no-floating-promises
        void fetchSites().catch((err: unknown): void => {
          logError(LOG_SOURCE, err, 'Unhandled promise rejection in fetchSites');
          // Ensure loading state is cleared even on error to prevent UI freeze
          setIsLoading(false);
        });
      }, 100); // Delay to ensure page is fully loaded and interactive
    };

    // Wait for document to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startFetch, { once: true });
    } else {
      startFetch();
    }

    // Cleanup timeout if component unmounts
    return (): void => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [fetchSites]);

  // Refresh function that clears cache and re-fetches
  const refresh = React.useCallback(async (): Promise<void> => {
    if (siteServiceRef.current) {
      siteServiceRef.current.clearCache();
    }
    // fetchSites handles errors internally via withErrorBoundary
    // Re-throw to allow caller to handle if needed
    await fetchSites();
  }, [fetchSites]);

  // Select site function - optimized to avoid unnecessary updates
  const selectSite = React.useCallback((site: ISite): void => {
    // Validate site parameter using validation utility
    if (!isValidSite(site)) {
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
    // Validate URL parameter using validation utility
    if (!isNonEmptyString(url)) {
      logError(LOG_SOURCE, new Error('Invalid URL provided to navigateToSite'), `URL: ${String(url)}`);
      return;
    }
    
    // Use safe execution wrapper for consistent error handling
    safeExecuteSync(
      (): void => {
        navigateToSiteUtil(url, openInNewTab);
      },
      {
        logError: true,
        logSource: LOG_SOURCE,
        context: `Error navigating to site: ${url}`,
        rethrow: false,
      }
    );
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
