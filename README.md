# Helvety SPO Explorer

![Node.js](https://img.shields.io/badge/Node.js-22.14.0-green)
![SPFx](https://img.shields.io/badge/SPFx-1.22.1-blue)
![React](https://img.shields.io/badge/React-17.0.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.0-blue)
![Fluent UI](https://img.shields.io/badge/Fluent%20UI-8.125.0-purple)
![Heft](https://img.shields.io/badge/Heft-1.1.2-orange)

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

**Privacy First** - All data processing happens client-side. User preferences (favorites and settings) are stored locally in the browser's localStorage. The application does not collect or transmit user data to external servers (SharePoint Search API is used for site discovery only).

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
│   │   └── SettingsService.ts  # User settings management
│   ├── types/              # TypeScript type definitions
│   │   ├── ComponentProps.ts
│   │   ├── Site.ts
│   │   └── JSOM.d.ts
│   └── utils/              # Utility functions
│       ├── constants/      # Application constants
│       ├── customHooks/    # Custom React hooks
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
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md
│   └── DESIGN_DECISIONS.md
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

This repository is public for transparency purposes only—all code is open for inspection so users can verify its behavior.

**No license is granted; this is the default "All rights reserved" status.** You may view the code, but you cannot reuse, redistribute, or sell it without explicit permission. All rights are retained by the author.

## Version History

| Version | Date             | Comments                    |
| ------- | ---------------- | --------------------------- |
| 0.0.1   | January 27, 2026 | Initial release with comprehensive code quality improvements: reduced duplication, simplified complex functions, improved type safety, unified error handling, and optimized performance |
| 0.0.1   | January 28, 2026 | Fixed SharePoint packaging issues: removed invalid JSON comments from manifest, removed ClientSideInstance.xml from elementManifests for site-level deployment |
| 1.0.0.3 | January 28, 2026 | Version bump to 1.0.0.3 - build verification and code quality improvements |
| 1.0.0.3 | January 28, 2026 | Added screenshots section to README showcasing application features in both light and dark themes |

## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**
