# Helvety SPO Explorer

![Node.js](https://img.shields.io/badge/Node.js-22.14.0-green)
![SPFx](https://img.shields.io/badge/SPFx-1.22.2-blue)
![React](https://img.shields.io/badge/React-17.0.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![Fluent UI](https://img.shields.io/badge/Fluent%20UI-8.125.5-purple)
![Heft](https://img.shields.io/badge/Heft-1.2.7-orange)
![License](https://img.shields.io/badge/License-MIT-green)

## Screenshots

### Light Theme

![SplitButton - Light Theme](https://raw.githubusercontent.com/CasparRubin/helvety-spo-explorer/main/public/screenshots/1%20-%20SplitButton.png)
*Navigation bar with split button in light theme*

![Panel - Light Theme](https://raw.githubusercontent.com/CasparRubin/helvety-spo-explorer/main/public/screenshots/2%20-%20Panel.png)
*Sites panel displaying available sites in light theme*

![Settings](https://raw.githubusercontent.com/CasparRubin/helvety-spo-explorer/main/public/screenshots/3%20-%20Settings.png)
*Settings panel for customizing display preferences*

![Search](https://raw.githubusercontent.com/CasparRubin/helvety-spo-explorer/main/public/screenshots/4%20-%20Search.png)
*Search functionality with highlighted matches*

![Quick Access Favorites](https://raw.githubusercontent.com/CasparRubin/helvety-spo-explorer/main/public/screenshots/5%20-%20QuickAccessFavorites.png)
*Quick access dropdown menu showing favorite sites*

### Dark Theme

![SplitButton - Dark Theme](https://raw.githubusercontent.com/CasparRubin/helvety-spo-explorer/main/public/screenshots/6%20-%20DarkThemeSplitButton.png)
*Navigation bar with split button in dark theme*

![Panel - Dark Theme](https://raw.githubusercontent.com/CasparRubin/helvety-spo-explorer/main/public/screenshots/7%20-%20DarkThemePanel.png)
*Sites panel displaying available sites in dark theme*

---

A SharePoint Framework (SPFx) application customizer that provides a navigation bar for exploring and accessing SharePoint sites. The extension displays a "Sites you have access to" button in the top placeholder, which opens a panel with a searchable list of up to 500 SharePoint sites the current user can access.

**100% Free** - Helvety SPO Explorer is now fully free for all users, with no paid tiers and no tenant-based limits.

**Privacy First** - All data processing happens client-side. User preferences (favorites and settings) are stored locally in the browser's localStorage. The extension only calls the SharePoint Search API for site discovery (no additional tracking services). See our [Privacy Policy](https://helvety.com/privacy) for details.

## Features

- **Site Discovery** - Automatically fetches and displays up to 500 SharePoint sites the current user has access to
- **Real-time Search** - Search across site titles, descriptions, and URLs with highlighted matches
- **Favorites Management** - Mark frequently used sites as favorites for quick access
- **Quick Access Menu** - Dropdown menu from the navbar button showing favorite sites
- **Settings Panel** - Customize display preferences:
  - Show/hide full URLs
  - Show/hide partial URLs (path only)
  - Show/hide site descriptions
  - Open sites in new tab vs current tab
- **About Tab** - App description (including permission-context note), contact (contact@helvety.com), links, version and build date
- **SharePoint Search API** - Uses SharePoint Search API to fetch up to 500 sites the user has access to (no additional permissions required)
- **Performance Optimized** - 5-minute caching, React.memo optimizations, and efficient rendering
- **Accessibility** - Full keyboard navigation support, ARIA labels, and screen reader support
- **Theme Aware** - Automatically adapts to SharePoint light/dark themes
- **Error Handling** - Comprehensive error handling with user-friendly messages

## How It Works

1. **Deployment** - Upload the `.sppkg` to your **tenant** App Catalog and enable the app
2. **Add to all sites** - When prompted, select **"Enable this app and add it to all sites"** so the extension appears on every site in your tenant automatically (no per-site installation needed)
3. **Usage** - On any SharePoint site, click the "Sites you have access to" button in the top navigation bar
4. **Explore** - Browse, search, and favorite sites from the panel
5. **Customize** - Adjust display preferences in the Settings tab, or view app info in the About tab

**Note:** When deployed tenant-wide, the extension does **not** appear in "Add an app" / Site contents—it is activated on all sites by the Tenant Wide Extensions list. Allow up to ~20 minutes after first deployment for it to appear everywhere.

**Where the extension appears:** "Add to all sites" means the extension is *registered* for all sites, but it **only renders** on pages that support the Top placeholder. It appears on **modern site home pages** and other modern pages that use the standard SharePoint shell (e.g. `https://tenant.sharepoint.com/sites/SiteName`). It does **not** appear on classic SharePoint pages, modern list or library views when opened directly, or some modern application pages (e.g. Site Contents). So the button shows on "all sites" when you are viewing such a supported page.

## Deployment

- **First-time setup:** Upload the solution package to your **tenant** App Catalog (not a site collection app catalog). When enabling the app, check **"Enable this app and add it to all sites"** so the extension runs on all sites. Propagation can take up to about 20 minutes.
- **Updates:** When deploying a newer package version, you can leave "Add to all sites" **unchecked** to avoid duplicate entries in Tenant Wide Extensions; the existing registration will continue to use the updated assets. If you see duplicate entries, remove them from the App Catalog → Site contents → **Tenant Wide Extensions** list.
- **Verification:** In the App Catalog site, go to Site contents → **Tenant Wide Extensions** to confirm an entry for "HelvetySpoExplorer" exists.

**App Catalog listing:** Title, icon, description, and screenshots in the App Catalog come from `config/package-solution.json` and assets in `sharepoint/assets/` (e.g. `appicon.png` 96×96, `screenshot1.png`–`screenshot5.png`). Place or replace `appicon.png` in `sharepoint/assets/` as needed. After uploading the `.sppkg`, set **Support URL** (and **Publisher** if it is still blank) once in the app’s details in the App Catalog UI—these are not in the manifest.

**Pre-deployment:** Run `npm run predeploy` to run format check, type check, lint, and production build (no test suite).

**Development standards:** See `.cursor/rules/` for after-change checklist (comments, README, legal/static docs), official-docs-first (SPFx, Fluent UI, Heft), and spo-explorer-stack conventions.

## Troubleshooting

If the extension does not show on some sites:

- **Propagation delay:** After first enabling "Add to all sites", wait up to **~20 minutes** for the Tenant Wide Extensions list to propagate before expecting the extension everywhere.
- **Tenant Wide Extensions:** In App Catalog → Site contents → **Tenant Wide Extensions**, confirm there is exactly **one** entry for "HelvetySpoExplorer" (ComponentId `3f9d14c6-c154-4aaf-bcb9-b1f3c064fd4c`). Remove any duplicate or old entries.
- **Page type:** The extension only runs on modern pages that provide the Top placeholder (e.g. site home). It does not run on classic pages or modern list/library views—see "Where the extension appears" under How It Works.
- **Script loading:** On a site where the extension is missing, open **F12 → Network**, reload the page, and check that the extension’s script requests succeed (e.g. 200). Check **Console** for CSP or script errors. If you host assets on an external CDN, ensure that CDN is allowed in **SharePoint Admin Center → Advanced → Script sources** (or equivalent).
- **Extension not loading / Script error for componentId / "spfx:" or "relative-path.invalid" in console:** If you are running `heft start`, open the site only via the URL provided by the dev server (with debug manifest). If you are testing the deployed app, upload the latest .sppkg to the App Catalog, update the app, wait a few minutes, and hard-refresh the site so the tenant uses the new version instead of an old one (e.g. 1.0.0.7).

## Tech Stack

This project is built with modern web technologies:

- **SharePoint Framework 1.22.2** - Microsoft's framework for building SharePoint extensions
- **React 17.0.1** - UI library
- **TypeScript 5.8.3** - Type-safe JavaScript
- **Fluent UI 8.125.5** - Microsoft's design system (formerly Office UI Fabric)
- **Heft 1.2.7** - Build system from Rush Stack
- **SharePoint Search API** - For site discovery and data fetching

## Architecture & Performance

This application is built with performance and code quality in mind:

- **Service Layer Architecture** - Separated business logic into services for maintainability
- **Custom Hooks** - Reusable React hooks for common patterns (sites, favorites, settings)
- **Type Safety** - Comprehensive TypeScript types with explicit return types throughout
- **Error Handling** - Centralized error handling with unified patterns, error categorization, and user-friendly messages
- **Performance Optimizations** - React.memo with custom comparison functions, useCallback, and useMemo
- **Caching Strategy** - 5-minute in-memory cache for site data to reduce API calls
- **SharePoint Search Integration** - Uses SharePoint Search API for reliable and consistent site discovery across tenants
- **Code Organization** - Modular architecture with extracted utilities, shared service patterns, and reusable components
- **Accessibility** - Full keyboard navigation, ARIA labels, and screen reader support
- **Code Quality** - Reduced duplication, simplified complex functions, improved type safety, and consistent patterns

## Developer

This application is developed and maintained by [Helvety](https://helvety.com), a Swiss company committed to transparency, strong security, and respect for user privacy and data protection.

For questions or inquiries, please contact us at [contact@helvety.com](mailto:contact@helvety.com).

## License & Usage

Helvety SPO Explorer is open source and released under the MIT License.

You are free to use, copy, modify, merge, publish, distribute, sublicense, and sell this software under the terms of the MIT License.

This software is provided **AS IS**, without warranty of any kind, express or implied. By using this software, you accept that the authors and copyright holders are not liable for claims, damages, or other liability.

See [LICENSE](./LICENSE) for the full legal text.

## Version History

| Version | Date             | Comments                    |
| ------- | ---------------- | --------------------------- |
| 0.0.1   | January 27, 2026 | Initial release with comprehensive code quality improvements: reduced duplication, simplified complex functions, improved type safety, unified error handling, and optimized performance |
| 0.0.1   | January 28, 2026 | Fixed SharePoint packaging issues: removed invalid JSON comments from manifest; ClientSideInstance.xml was temporarily removed from packaging (re-added in 1.0.0.5 for tenant-wide deployment) |
| 1.0.0.3 | January 28, 2026 | Version bump to 1.0.0.3 - build verification and code quality improvements |
| 1.0.0.3 | January 28, 2026 | Added screenshots section to README showcasing application features in both light and dark themes |
| 1.0.0.3 | January 28, 2026 | Comprehensive code quality improvements: enhanced type safety with improved type guards and narrowing, optimized React.memo with custom comparison functions, improved error recovery logic, enhanced documentation with examples and edge cases, and updated UI text for clarity |
| 1.0.0.5 | February 3, 2026 | Tenant-wide deployment: added ClientSideInstance.xml to package so "Enable this app and add it to all sites" registers the extension on all sites automatically; extension no longer requires per-site installation |
| 1.0.0.6 | February 3, 2026 | Version bump; documentation updated for tenant-wide deployment (README How It Works, Deployment section, version history) |
| 1.0.0.6 | February 3, 2026 | Documentation: clarified where extension appears (modern pages with Top placeholder only; not classic or list/library views); added Troubleshooting section (propagation, Tenant Wide Extensions, page type, script loading) |
| 1.0.0.7 | February 3, 2026 | Version bump to 1.0.0.7 |
| 1.0.0.8 | February 3, 2026 | App Catalog metadata: title, icon (96×96), screenshots, categories in package-solution.json; assets in sharepoint/assets |
| 1.0.1.0 | February 3, 2026 | Version bump to 1.0.1.0; app icon from Helvety branding (96×96 PNG in sharepoint/assets); removed prepare-app-catalog-assets script; docs updated |
| 1.0.1.1 | February 3, 2026 | About tab: app description, contact (contact@helvety.com), version and build date; build-info injection script (prebuild/prestart) |
| 1.0.1.2 | February 3, 2026 | Version bump; app icon renamed to appicon-96.png (cache bust); screenshots removed from package |
| 1.0.1.3 | February 3, 2026 | About tab simplified; docs and comments updated |
| 1.0.1.4 | February 4, 2026 | Code cleanup: removed unused dependencies (@tanstack/react-table, react-window, @types/react-window) |
| 1.0.1.5 | February 4, 2026 | Pre-deployment maintenance release |

## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**
