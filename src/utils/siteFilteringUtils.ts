import { ISite } from "../types/Site";
import { validateAndNormalizeUrl } from "./urlUtils";

/**
 * Normalizes and filters sites for safe navigation.
 * Only keeps entries with both a site id and an allowed SharePoint HTTPS URL.
 */
export function normalizeAndFilterNavigableSites(
  sites: readonly ISite[]
): ISite[] {
  return sites
    .map(
      (site: ISite): ISite => ({
        ...site,
        url: validateAndNormalizeUrl(site.url).normalizedUrl,
      })
    )
    .filter((site: ISite): boolean => Boolean(site.id && site.url));
}
