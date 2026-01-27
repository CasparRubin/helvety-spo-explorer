# Design Decisions

This document captures key design decisions and their rationale.

## Architecture Decisions

### 1. No Global State Management

**Decision**: Use React hooks for local state management instead of Redux/Zustand.

**Rationale**:
- Application is relatively simple with limited shared state
- Hooks provide sufficient state management capabilities
- Reduces bundle size and complexity
- Easier to understand and maintain

**Trade-offs**:
- May need to refactor if application grows significantly
- Some prop drilling occurs (acceptable for current scope)

### 2. Dual API Strategy (Search + WebInfos)

**Decision**: Use SharePoint Search API as primary, fallback to WebInfos API.

**Rationale**:
- Search API is faster and better for large tenants
- WebInfos API provides reliable fallback
- Ensures application works even if Search API is unavailable
- Better user experience with automatic fallback

**Trade-offs**:
- More complex error handling
- Two code paths to maintain

### 3. localStorage for Persistence

**Decision**: Use browser localStorage for favorites and settings.

**Rationale**:
- Simple, no backend required
- Fast access
- Per-user storage (using userId as key)
- Sufficient for current requirements

**Trade-offs**:
- Limited storage quota (5-10MB typically)
- Not synchronized across devices
- May need migration if moving to cloud storage

### 4. In-Memory Caching

**Decision**: Cache site results in memory for 5 minutes.

**Rationale**:
- Reduces API calls
- Improves performance
- 5-minute TTL balances freshness vs. performance

**Trade-offs**:
- Cache invalidation complexity
- Memory usage (acceptable for typical site counts)

## Component Design Decisions

### 5. Memoization Strategy

**Decision**: Use React.memo and useMemo strategically.

**Rationale**:
- Prevents unnecessary re-renders
- Improves performance for large lists
- Custom comparison functions for complex components

**Trade-offs**:
- Slightly more complex code
- Need to maintain comparison functions

### 6. Favorite Sites Snapshot Pattern

**Decision**: Use snapshot pattern for favorite sites in SitesPanel.

**Rationale**:
- Ensures consistent sorting when switching tabs
- Prevents UI flicker from rapid favorite changes
- Better user experience

**Trade-offs**:
- More complex state management
- Requires careful synchronization

## Type Safety Decisions

### 7. Branded Types for IDs

**Decision**: Use branded types (SiteId, WebId) instead of plain strings.

**Rationale**:
- Prevents mixing site IDs with web IDs
- Better type safety
- Catches bugs at compile time

**Trade-offs**:
- Requires type assertions when creating IDs
- Slightly more verbose

### 8. Explicit Return Types

**Decision**: Require explicit return types for all functions.

**Rationale**:
- Better code documentation
- Catches type errors early
- Improves IDE support

**Trade-offs**:
- More verbose code
- Requires discipline to maintain

## Error Handling Decisions

### 9. Custom Error Classes

**Decision**: Use custom error classes (ApiError, PermissionError, etc.).

**Rationale**:
- Better error categorization
- Enables targeted error handling
- Improves error messages

**Trade-offs**:
- More code to maintain
- Need to ensure consistent usage

### 10. Never-Throwing Pattern

**Decision**: Many utility functions never throw, return safe defaults instead.

**Rationale**:
- Prevents application crashes
- Better user experience
- Errors logged but don't break flow

**Trade-offs**:
- May hide some errors
- Need careful error logging

## Performance Decisions

### 11. Shallow Equality Checks

**Decision**: Use shallow equality for settings comparison.

**Rationale**:
- Prevents unnecessary re-renders
- Fast comparison
- Sufficient for current use case

**Trade-offs**:
- Won't detect deep object changes
- May need deep equality for nested objects in future

### 12. URL Normalization

**Decision**: Normalize URLs (lowercase, remove trailing slash) for favorites.

**Rationale**:
- Consistent comparison
- Prevents duplicates
- Better user experience

**Trade-offs**:
- Slight performance overhead
- May need to handle edge cases

## Testing Decisions

### 13. Jest for Testing

**Decision**: Use Jest (via Heft) for unit testing.

**Rationale**:
- Integrated with SPFx build system
- Good TypeScript support
- Familiar to most developers

**Trade-offs**:
- Limited to unit tests initially
- May need additional tools for E2E testing

## Code Organization Decisions

### 14. Constants Splitting

**Decision**: Split large constants.ts into domain-specific modules.

**Rationale**:
- Better organization
- Easier to find constants
- Reduces merge conflicts
- Clearer dependencies

**Trade-offs**:
- More files to manage
- Need to maintain index exports

### 15. Shared Storage Utilities

**Decision**: Extract localStorage operations into shared utilities.

**Rationale**:
- Reduces code duplication
- Consistent error handling
- Easier to test
- Single point of change

**Trade-offs**:
- Additional abstraction layer
- Need to ensure backward compatibility

## Accessibility Decisions

### 16. ARIA Labels Throughout

**Decision**: Add comprehensive ARIA labels and roles.

**Rationale**:
- Better screen reader support
- Improves accessibility
- Required for compliance

**Trade-offs**:
- More verbose markup
- Need to maintain labels

### 17. Keyboard Navigation

**Decision**: Support full keyboard navigation.

**Rationale**:
- Accessibility requirement
- Better user experience
- Professional application

**Trade-offs**:
- More event handlers
- Need to test thoroughly

## Future Considerations

These decisions may need revisiting as the application grows:

- **State Management**: Consider Redux/Zustand if state becomes complex
- **Caching**: May need more sophisticated cache invalidation
- **Storage**: Consider IndexedDB for larger datasets
- **API**: May want to add Graph API support
- **Testing**: Add E2E tests with Playwright/Cypress
