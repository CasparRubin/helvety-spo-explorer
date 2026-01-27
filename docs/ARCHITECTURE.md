# Architecture Overview

## Introduction

This document provides an overview of the architecture of the helvety-spo-explorer SharePoint Framework (SPFx) application customizer. The application provides a navigation bar for exploring and accessing SharePoint sites.

## Technology Stack

- **Framework**: SharePoint Framework (SPFx) 1.22.1
- **UI Library**: React 17 with Fluent UI (Office UI Fabric) 8.x
- **Language**: TypeScript 5.8
- **Build Tool**: Rush Stack Heft
- **Testing**: Jest (via Heft)

## Application Structure

```
src/
├── components/          # React components
│   ├── ErrorBoundary/   # Error boundary component
│   ├── Navbar/          # Main navigation bar
│   ├── SitesList/       # Sites list component
│   └── SitesPanel/      # Side panel with tabs
├── extensions/          # SPFx application customizer
├── services/            # Business logic services
├── types/               # TypeScript type definitions
└── utils/               # Utility functions and hooks
    ├── constants/       # Application constants (organized by domain)
    ├── customHooks/     # Custom React hooks
    └── styles/          # Style definitions
```

## Core Components

### Application Customizer

The entry point is `HelvetySpoExplorerApplicationCustomizer.ts`, which registers the Navbar component in the SharePoint top placeholder.

### Navbar Component

The main navigation component that:
- Displays a button to open the sites panel
- Shows a dropdown menu with favorite sites
- Manages site fetching, favorites, and settings

### SitesPanel Component

A side panel that slides in from the left, containing:
- **Sites Tab**: Searchable list of sites with favorites
- **Settings Tab**: User preference settings

### SitesList Component

Displays a searchable, sortable list of SharePoint sites with:
- Search functionality (searches title, description, URL)
- Favorite sites sorting (favorites appear first)
- Highlighting of search matches
- Loading and error states

## Services Layer

### SiteService

Fetches SharePoint sites using:
1. **Primary**: SharePoint Search API (faster, better for large tenants)
2. **Fallback**: WebInfos API (when search API is unavailable)

Features:
- Results cached for 5 minutes
- Automatic fallback between APIs
- Comprehensive error handling

### FavoriteService

Manages favorite sites in localStorage:
- Per-user storage
- URL normalization (lowercase, trailing slash removal)
- CRUD operations for favorites

### SettingsService

Manages user preferences in localStorage:
- Display options (URL visibility, descriptions)
- Navigation preferences (open in new tab)
- Per-user storage with defaults

## Data Flow

1. **Initialization**: Application customizer mounts → Navbar component initializes
2. **Site Fetching**: Navbar uses `useSites` hook → SiteService fetches sites → Results cached
3. **Favorites**: User toggles favorite → FavoriteService updates localStorage → UI updates
4. **Settings**: User changes settings → SettingsService updates localStorage → UI updates
5. **Navigation**: User selects site → Navigation utility opens URL → Site opens

## State Management

The application uses React hooks for state management:

- **useSites**: Manages site fetching, loading, error states, and selection
- **useFavorites**: Manages favorite sites state and operations
- **useSettings**: Manages user settings state and persistence

All state is local to components - no global state management library is used.

## Error Handling

### Error Categories

- **NETWORK**: API/network related errors
- **PERMISSION**: Authorization/permission errors
- **VALIDATION**: Data parsing/validation errors
- **UNKNOWN**: Unrecognized errors

### Error Classes

- `AppError`: Base error class
- `ApiError`: API-related errors
- `PermissionError`: Permission errors
- `ValidationError`: Validation errors

### Error Boundaries

React error boundaries catch component errors and display fallback UI.

## Performance Optimizations

1. **Caching**: Site results cached for 5 minutes
2. **Memoization**: React.memo for components, useMemo for expensive computations
3. **Lazy Loading**: Components loaded as needed
4. **Efficient Filtering**: Memoized search and sort operations

## Accessibility

- ARIA labels and roles throughout
- Keyboard navigation support
- Screen reader announcements
- Focus management
- Semantic HTML

## Testing Strategy

- **Unit Tests**: Services and utilities
- **Component Tests**: React components (planned)
- **Integration Tests**: End-to-end flows (planned)

## Constants Organization

Constants are organized by domain:
- `appConstants.ts`: Application-wide constants (storage, cache, defaults)
- `apiConstants.ts`: API endpoints and query parameters
- `uiConstants.ts`: UI messages and labels
- `layoutConstants.ts`: Layout, spacing, typography, visual design

## Storage Strategy

- **localStorage**: Used for favorites and settings (per-user)
- **In-Memory Cache**: Used for site results (5-minute TTL)
- **Error Handling**: All storage operations handle QuotaExceededError and access errors

## Future Considerations

- Consider adding global state management (Redux/Zustand) if complexity grows
- Add service worker for offline support
- Implement virtual scrolling for large site lists
- Add analytics tracking
- Consider Graph API for site fetching (alternative to Search API)
