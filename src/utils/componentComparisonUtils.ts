/**
 * Component comparison utilities
 *
 * Provides optimized comparison functions for React.memo to prevent unnecessary re-renders.
 * Uses safe reference/primitive checks to avoid stale UI caused by heuristic
 * sampling comparators that can miss in-array updates.
 */

import { ISitesListProps } from "../types/ComponentProps";
import { ISite } from "../types/Site";

/**
 * Compares two sites arrays safely
 *
 * We intentionally avoid heuristic sampling (first/middle/last) because it can
 * miss valid updates and leave the UI stale. If the array reference changes,
 * we re-render.
 *
 * @param prevSites - Previous sites array
 * @param nextSites - Next sites array
 * @returns true if arrays are equal (skip re-render), false if different (re-render)
 */
function compareSitesArrays(
  prevSites: readonly ISite[],
  nextSites: readonly ISite[]
): boolean {
  return prevSites === nextSites;
}

/**
 * Compares callback functions by reference
 */
function compareCallbacks(
  prevCallbacks: {
    onSiteSelect?: unknown;
    onToggleFavorite?: unknown;
    onRefresh?: unknown;
  },
  nextCallbacks: {
    onSiteSelect?: unknown;
    onToggleFavorite?: unknown;
    onRefresh?: unknown;
  }
): boolean {
  return (
    prevCallbacks.onSiteSelect === nextCallbacks.onSiteSelect &&
    prevCallbacks.onToggleFavorite === nextCallbacks.onToggleFavorite &&
    prevCallbacks.onRefresh === nextCallbacks.onRefresh
  );
}

/**
 * Compares primitive values (booleans, strings, numbers)
 */
function comparePrimitives(
  prev: {
    showFullUrl?: boolean;
    showPartialUrl?: boolean;
    showDescription?: boolean;
    isLoading?: boolean;
    error?: string | undefined;
  },
  next: {
    showFullUrl?: boolean;
    showPartialUrl?: boolean;
    showDescription?: boolean;
    isLoading?: boolean;
    error?: string | undefined;
  }
): boolean {
  return (
    prev.showFullUrl === next.showFullUrl &&
    prev.showPartialUrl === next.showPartialUrl &&
    prev.showDescription === next.showDescription &&
    prev.isLoading === next.isLoading &&
    prev.error === next.error
  );
}

/**
 * Compares selected site by ID
 */
function compareSelectedSite(
  prevSite: ISite | undefined,
  nextSite: ISite | undefined
): boolean {
  return prevSite?.id === nextSite?.id;
}

/**
 * Compares Sets by reference
 */
function compareSets(
  prevSets: { favoriteSites?: Set<string>; displayFavoriteSites?: Set<string> },
  nextSets: { favoriteSites?: Set<string>; displayFavoriteSites?: Set<string> }
): boolean {
  return (
    prevSets.favoriteSites === nextSets.favoriteSites &&
    prevSets.displayFavoriteSites === nextSets.displayFavoriteSites
  );
}

/**
 * Compares SitesList component props for React.memo optimization
 *
 * Multi-stage comparison: callbacks/Sets (reference), primitives (value), arrays (reference).
 *
 * @param prevProps - Previous component props
 * @param nextProps - Next component props
 * @returns true if props are equal (skip re-render), false if different (re-render)
 */
export function compareSitesListProps(
  prevProps: ISitesListProps,
  nextProps: ISitesListProps
): boolean {
  // Stage 1: Fast reference equality checks for stable props (callbacks, Sets)
  if (!compareCallbacks(prevProps, nextProps)) {
    return false;
  }

  // Stage 2: Check display settings (cheap boolean/number comparisons)
  if (!comparePrimitives(prevProps, nextProps)) {
    return false;
  }

  // Stage 3: Check selected site (compare by ID - cheap string comparison)
  if (!compareSelectedSite(prevProps.selectedSite, nextProps.selectedSite)) {
    return false;
  }

  // Stage 4: Check Sets (reference equality - very fast)
  if (!compareSets(prevProps, nextProps)) {
    return false;
  }

  // Stage 5: Check sites array using strategic sampling
  return compareSitesArrays(prevProps.sites, nextProps.sites);
}
