# Helvety SPO Explorer

![Node.js](https://img.shields.io/badge/Node.js-22.14.0-green)
![SPFx](https://img.shields.io/badge/SPFx-1.22.1-blue)
![React](https://img.shields.io/badge/React-17.0.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.0-blue)
![Fluent UI](https://img.shields.io/badge/Fluent%20UI-8.125.0-purple)
![Heft](https://img.shields.io/badge/Heft-1.1.2-orange)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red)

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

A SharePoint Framework (SPFx) application customizer that provides a navigation bar for exploring and accessing SharePoint sites. The extension displays a "Sites you have access to" button in the top placeholder, which opens a panel with a searchable list of all SharePoint sites the current user can access.

**Privacy First** - All data processing happens client-side. User preferences (favorites and settings) are stored locally in the browser's localStorage. The extension makes two types of external calls: (1) SharePoint Search API for site discovery, and (2) store.helvety.com API for license validation (only your tenant ID is transmitted, no personal data). See our [Privacy Policy](https://helvety.com/privacy) for details.

## Features

* **Site Discovery** - Automatically fetches and displays all SharePoint sites the current user has access to
* **Real-time Search** - Search across site titles, descriptions, and URLs with highlighted matches
* **Favorites Management** - Mark frequently used sites as favorites for quick access
* **Quick Access Menu** - Dropdown menu from the navbar button showing favorite sites
* **Settings Panel** - Customize display preferences:
  - Show/hide full URLs
  - Show/hide partial URLs (path only)
  - Show/hide site descriptions
  - Open sites in new tab vs current tab
* **SharePoint Search API** - Uses SharePoint Search API to fetch sites the user has access to (no additional permissions required)
* **Performance Optimized** - 5-minute caching, React.memo optimizations, and efficient rendering
* **Accessibility** - Full keyboard navigation support, ARIA labels, and screen reader support
* **Theme Aware** - Automatically adapts to SharePoint light/dark themes
* **Error Handling** - Comprehensive error handling with user-friendly messages

## How It Works

1. **Installation** - Deploy the SPFx solution package to your SharePoint App Catalog
2. **Activation** - Install the app on your site(s) via "Add an app" (the extension activates automatically via Feature Framework)
3. **Usage** - Click the "Sites you have access to" button in the top navigation bar
4. **Explore** - Browse, search, and favorite sites from the panel
5. **Customize** - Adjust display preferences in the Settings tab

## Pricing

Helvety SPO Explorer is available via subscription at [store.helvety.com](https://store.helvety.com/products/helvety-spo-explorer):

| Feature | Basic (CHF 250/month) | Enterprise (CHF 500/month) |
|---------|----------------------|---------------------------|
| Full extension features | Yes | Yes |
| All sites navigation | Yes | Yes |
| Favorites and quick access | Yes | Yes |
| Settings customization | Yes | Yes |
| Updates included | Yes | Yes |
| Tenants per subscription | 1 | Up to 5 |
| Priority support | - | Yes |
| Dedicated setup assistance | - | Yes |

**[Subscribe Now](https://store.helvety.com/products/helvety-spo-explorer)** | Contact us at [contact@helvety.com](mailto:contact@helvety.com) for enterprise inquiries.

## Licensing

Helvety SPO Explorer uses a **tenant-based licensing model**. After purchasing a subscription at [store.helvety.com](https://store.helvety.com), you register your SharePoint tenant ID(s) in your account dashboard.

### How It Works

1. **Purchase** - Subscribe to Basic or Enterprise at [store.helvety.com](https://store.helvety.com/products/helvety-spo-explorer)
2. **Register Tenant** - Add your SharePoint tenant ID (e.g., "contoso" from contoso.sharepoint.com) in your store account
3. **Deploy** - Install the extension on your SharePoint sites as described in the Deployment section
4. **Automatic Validation** - The extension validates your license in the background without blocking functionality

### License Validation

The extension is designed for **enterprise reliability**:

* **Non-blocking** - Core functionality (site navigation, favorites, search) loads immediately while license validation happens in the background
* **Fail-open** - If the license server is temporarily unreachable, the extension continues working normally
* **Grace period** - If your subscription lapses, you have a 7-day grace period before features are restricted
* **Caching** - Valid licenses are cached for 24 hours to minimize API calls and ensure offline resilience

### Unlicensed Behavior

Without a valid license, the extension operates in a limited demo mode:

* Site list is limited to 2 sites
* A "Get License" button appears in the navigation bar linking to the store
* All other features (favorites, search, settings) remain functional

### Tenant Limits

* **Basic** - 1 tenant per subscription
* **Enterprise** - Up to 5 tenants per subscription

## Tech Stack

This project is built with modern web technologies:

* **SharePoint Framework 1.22.1** - Microsoft's framework for building SharePoint extensions
* **React 17.0.1** - UI library
* **TypeScript 5.8.0** - Type-safe JavaScript
* **Fluent UI 8.125.0** - Microsoft's design system (formerly Office UI Fabric)
* **Heft 1.1.2** - Build system from Rush Stack
* **SharePoint Search API** - For site discovery and data fetching

## Project Structure

```
helvety-spo-explorer/
├── src/
│   ├── components/          # React components
│   │   ├── ErrorBoundary/  # Error boundary component
│   │   ├── Navbar/         # Main navigation bar component
│   │   ├── SitesList/      # Sites list and site row components
│   │   └── SitesPanel/     # Panel with sites and settings tabs
│   ├── extensions/          # SPFx application customizer
│   │   └── helvetySpoExplorer/
│   │       ├── HelvetySpoExplorerApplicationCustomizer.ts
│   │       └── loc/         # Localization files
│   ├── services/           # Business logic services
│   │   ├── SiteService.ts      # SharePoint site fetching
│   │   ├── FavoriteService.ts  # Favorites management
│   │   ├── SettingsService.ts  # User settings management
│   │   └── LicenseService.ts   # License validation
│   ├── types/              # TypeScript type definitions
│   │   ├── ComponentProps.ts
│   │   ├── Site.ts
│   │   ├── License.ts          # License types
│   │   └── JSOM.d.ts
│   └── utils/              # Utility functions
│       ├── constants/      # Application constants
│       ├── customHooks/    # Custom React hooks
│       │   └── useLicense.ts   # License validation hook
│       ├── styles/         # Style definitions
│       ├── componentUtils.ts
│       ├── errorUtils.ts
│       ├── errorHandlingUtils.ts
│       ├── navigationUtils.ts
│       ├── serviceUtils.ts
│       ├── siteUtils.ts
│       ├── storageUtils.ts
│       ├── urlUtils.ts
│       └── validationUtils.ts
├── config/                 # Build configuration files
├── sharepoint/             # SharePoint solution assets
│   └── assets/
│       ├── ClientSideInstance.xml
│       └── elements.xml
└── [config files]          # Configuration files (TypeScript, ESLint, etc.)
```

## Architecture & Performance

This application is built with performance and code quality in mind:

* **Service Layer Architecture** - Separated business logic into services for maintainability
* **Custom Hooks** - Reusable React hooks for common patterns (sites, favorites, settings)
* **Type Safety** - Comprehensive TypeScript types with explicit return types throughout
* **Error Handling** - Centralized error handling with unified patterns, error categorization, and user-friendly messages
* **Performance Optimizations** - React.memo with custom comparison functions, useCallback, and useMemo
* **Caching Strategy** - 5-minute in-memory cache for site data to reduce API calls
* **SharePoint Search Integration** - Uses SharePoint Search API for reliable and consistent site discovery across tenants
* **Code Organization** - Modular architecture with extracted utilities, shared service patterns, and reusable components
* **Accessibility** - Full keyboard navigation, ARIA labels, and screen reader support
* **Code Quality** - Reduced duplication, simplified complex functions, improved type safety, and consistent patterns

## Prerequisites

- Node.js >=22.14.0 < 23.0.0
- A Microsoft 365 developer tenant or SharePoint Online tenant
- SharePoint Framework development environment set up

## Getting Started

### Installation

1. Clone this repository
2. Ensure that you are at the solution folder
3. In the command-line run:
   ```bash
   npm install -g @rushstack/heft
   npm install
   ```

### Development

Start the local development server:

```bash
npm start
```

This will:
- Build the project
- Start the local workbench
- Open your browser to the workbench URL

### Build

Build the production bundle:

```bash
npm run build
```

This will:
- Clean previous builds
- Compile TypeScript
- Run ESLint
- Bundle with Webpack
- Create the SharePoint solution package (.sppkg)

The solution package will be created at: `sharepoint/solution/helvety-spo-explorer.sppkg`

### Deployment

1. Upload the `.sppkg` file to your SharePoint App Catalog
2. Enable the app in the app catalog (select "Only enable this app" and click "Enable app")
3. Go to your target site, click the gear icon, and select "Add an app"
4. Search for and install the "helvety-spo-explorer-client-side-solution" app
5. The navigation bar will appear in the top placeholder automatically (Feature Framework-based activation)

## SharePoint Framework Concepts

This extension illustrates the following SharePoint Framework concepts:

- Application Customizers and placeholders
- SharePoint Search API integration for site discovery
- React component development with SPFx
- LocalStorage for user preferences
- Fluent UI component usage
- Error handling and logging in SPFx
- TypeScript type safety
- Performance optimization techniques

## References

- [Getting started with SharePoint Framework](https://docs.microsoft.com/sharepoint/dev/spfx/set-up-your-developer-tenant)
- [Building for Microsoft teams](https://docs.microsoft.com/sharepoint/dev/spfx/build-for-teams-overview)
- [SharePoint Search REST API](https://docs.microsoft.com/sharepoint/dev/general-development/sharepoint-search-rest-api-overview)
- [Publish SharePoint Framework applications to the Marketplace](https://docs.microsoft.com/sharepoint/dev/spfx/publish-to-marketplace-overview)
- [Microsoft 365 Patterns and Practices](https://aka.ms/m365pnp) - Guidance, tooling, samples and open-source controls for your Microsoft 365 development
- [Heft Documentation](https://heft.rushstack.io/)

## Developer

This application is developed and maintained by Helvety, a Swiss company committed to transparency, strong security, and respect for user privacy and data protection.

For questions or inquiries, please contact us at contact@helvety.com.

## License & Usage

This repository is public for transparency purposes only. All code is open for inspection so users can verify its behavior.

**All Rights Reserved.** No license is granted. You may view the code, but you may not copy, reuse, redistribute, modify, or sell it without explicit written permission.

Purchasing a subscription grants access to use the hosted service only—subscriptions do not grant any rights to the source code.

See [LICENSE](./LICENSE) for full terms.

## Version History

| Version | Date             | Comments                    |
| ------- | ---------------- | --------------------------- |
| 0.0.1   | January 27, 2026 | Initial release with comprehensive code quality improvements: reduced duplication, simplified complex functions, improved type safety, unified error handling, and optimized performance |
| 0.0.1   | January 28, 2026 | Fixed SharePoint packaging issues: removed invalid JSON comments from manifest, removed ClientSideInstance.xml from elementManifests for site-level deployment |
| 1.0.0.3 | January 28, 2026 | Version bump to 1.0.0.3 - build verification and code quality improvements |
| 1.0.0.3 | January 28, 2026 | Added screenshots section to README showcasing application features in both light and dark themes |
| 1.0.0.3 | January 28, 2026 | Comprehensive code quality improvements: enhanced type safety with improved type guards and narrowing, optimized React.memo with custom comparison functions, improved error recovery logic, enhanced documentation with examples and edge cases, and updated UI text for clarity |
| 1.0.0.4 | January 31, 2026 | Added subscription-based licensing: tenant registration via store.helvety.com, non-blocking license validation with fail-open behavior, 7-day grace period, "Get License" button for unlicensed users, 24-hour license caching for enterprise reliability |

## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**
