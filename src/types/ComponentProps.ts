import { ApplicationCustomizerContext } from "@microsoft/sp-application-base";
import { ISite } from "./Site";
import { IUserSettings } from "../services/SettingsService";

/**
 * Props for the Navbar component
 */
export interface INavbarProps {
  /** SharePoint application customizer context */
  context: ApplicationCustomizerContext;
}

/**
 * Props for the SitesPanel component
 */
export interface ISitesPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback when the panel is dismissed */
  onDismiss: () => void;
  /** List of sites to display */
  sites: ISite[];
  /** Currently selected site */
  selectedSite?: ISite;
  /** Callback when a site is selected */
  onSiteSelect: (site: ISite) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string;
  /** Set of favorite site URLs */
  favoriteSites?: Set<string>;
  /** Callback when a site is favorited/unfavorited (receives site URL) */
  onToggleFavorite?: (siteUrl: string) => void;
  /** Current user settings */
  settings: IUserSettings;
  /** Callback when settings are changed */
  onSettingsChange: (settings: IUserSettings) => void;
  /** Show/hide full URL in list */
  showFullUrl?: boolean;
  /** Show/hide partial URL (path only) in list */
  showPartialUrl?: boolean;
  /** Show/hide site description in list */
  showDescription?: boolean;
  /** Callback to refresh the sites list */
  onRefresh?: () => void;
  /** Whether the tenant has a valid license (default: true until checked) */
  isLicensed?: boolean;
  /** Whether the license check has completed */
  isLicenseChecked?: boolean;
}

/**
 * Props for the SitesList component
 */
export interface ISitesListProps {
  /** List of sites to display */
  sites: ISite[];
  /** Currently selected site */
  selectedSite?: ISite;
  /** Callback when a site is selected */
  onSiteSelect: (site: ISite) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string;
  /** Set of favorite site URLs (for icon display) */
  favoriteSites?: Set<string>;
  /** Set of favorite site URLs for sorting (snapshot captured when panel/tab opens) */
  displayFavoriteSites?: Set<string>;
  /** Callback when a site is favorited/unfavorited (receives site URL) */
  onToggleFavorite?: (siteUrl: string) => void;
  /** Show/hide full URL in list */
  showFullUrl?: boolean;
  /** Show/hide partial URL (path only) in list */
  showPartialUrl?: boolean;
  /** Show/hide site description in list */
  showDescription?: boolean;
  /** Measured height of panel header */
  headerHeight?: number;
  /** Ref to pivot container for measuring height */
  pivotRef?: React.RefObject<HTMLDivElement>;
  /** Ref to description element for measuring height */
  descriptionRef?: React.RefObject<HTMLDivElement>;
  /** Whether the Sites tab is currently active */
  isActiveTab?: boolean;
  /** Callback to refresh the sites list */
  onRefresh?: () => void;
  /** Whether the tenant has a valid license (default: true until checked) */
  isLicensed?: boolean;
  /** Whether the license check has completed */
  isLicenseChecked?: boolean;
}

/**
 * User settings interface
 */
export type { IUserSettings } from "../services/SettingsService";
