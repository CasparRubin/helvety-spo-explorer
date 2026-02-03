import { Log } from "@microsoft/sp-core-library";
import {
  BaseApplicationCustomizer,
  PlaceholderContent,
  PlaceholderName,
} from "@microsoft/sp-application-base";

import * as strings from "HelvetySpoExplorerApplicationCustomizerStrings";

// Import React
import * as React from "react";
import * as ReactDom from "react-dom";
import { Navbar } from "../../components/Navbar/Navbar";
import { INavbarProps } from "../../types/ComponentProps";
import { ErrorBoundary } from "../../components/ErrorBoundary/ErrorBoundary";
import { logError } from "../../utils/errorUtils";
import {
  getApplicationCustomizerStyles,
  APPLICATION_CUSTOMIZER_STYLE_ID,
} from "../../utils/applicationCustomizerStyles";

const LOG_SOURCE: string = "HelvetySpoExplorerApplicationCustomizer";

/**
 * Application Customizer properties interface.
 * If the extension uses ClientSideComponentProperties JSON input,
 * it will be deserialized into the BaseApplicationCustomizer.properties object.
 * You can define an interface to describe it.
 */
export interface IHelvetySpoExplorerApplicationCustomizerProperties {
  // No properties needed for this extension
}

/**
 * Application Customizer that renders the SPO Explorer navbar in the Top placeholder.
 * Only runs on pages that provide the Top placeholder (e.g. modern site home); does not run
 * on classic pages, modern list/library views, or some application pages. See README
 * "Where the extension appears" and "Troubleshooting".
 */
export default class HelvetySpoExplorerApplicationCustomizer extends BaseApplicationCustomizer<IHelvetySpoExplorerApplicationCustomizerProperties> {
  private _topPlaceholder: PlaceholderContent | undefined;
  private _isReactMounted: boolean = false;

  public onInit(): Promise<void> {
    const webUrl = this.context.pageContext?.web?.absoluteUrl;
    const siteUrl = this.context.pageContext?.site?.absoluteUrl;
    Log.info(
      LOG_SOURCE,
      `Initialized ${strings.Title}${webUrl ? ` - Web: ${webUrl}` : ""}${siteUrl ? `, Site: ${siteUrl}` : ""}`
    );

    try {
      // Check if placeholder provider is available
      if (!this.context.placeholderProvider) {
        const error = new Error(
          "PlaceholderProvider is not available in onInit"
        );
        logError(
          LOG_SOURCE,
          error,
          "Cannot initialize - PlaceholderProvider missing"
        );
        return Promise.resolve();
      }

      // Render immediately - SPFx handles timing
      this._renderPlaceHolders();
    } catch (error: unknown) {
      logError(
        LOG_SOURCE,
        error,
        "Error in onInit - extension may not function correctly"
      );
    }

    return Promise.resolve();
  }

  /**
   * Checks if React is already mounted to the placeholder
   * @returns true if React is already mounted, false otherwise
   */
  private _isReactAlreadyMounted(): boolean {
    if (!this._topPlaceholder || !this._topPlaceholder.domElement) {
      return false;
    }

    const domElement = this._topPlaceholder.domElement;

    // Check if element has React content by looking for React internal markers
    // React 17 stores fiber on the element
    // Note: We access React internals which are not part of the public API
    // but are necessary to detect if React is already mounted
    interface ReactInternalElement extends Element {
      _reactInternalFiber?: unknown;
    }
    interface ReactInternalContainer extends HTMLElement {
      _reactRootContainer?: unknown;
    }
    if (domElement.hasChildNodes()) {
      // Check for React root container or fiber
      const firstChild = domElement.firstChild as ReactInternalElement | null;
      if (firstChild && firstChild._reactInternalFiber) {
        return true;
      }
      // Check for React root container (React 17+)
      const container = domElement as ReactInternalContainer;
      if (container._reactRootContainer) {
        return true;
      }
      // Check if we've already mounted (our flag)
      if (this._isReactMounted) {
        return true;
      }
    }

    return false;
  }

  private _renderPlaceHolders(): void {
    // Check if React is already mounted - prevent multiple renders
    if (this._isReactAlreadyMounted()) {
      Log.verbose(LOG_SOURCE, "React already mounted, skipping render");
      return;
    }

    // Check if the top placeholder is already registered and available
    if (!this._topPlaceholder) {
      if (!this.context.placeholderProvider) {
        Log.error(
          LOG_SOURCE,
          new Error("PlaceholderProvider is not available")
        );
        return;
      }

      try {
        this._topPlaceholder =
          this.context.placeholderProvider.tryCreateContent(
            PlaceholderName.Top,
            { onDispose: this._onDispose }
          );
        Log.verbose(
          LOG_SOURCE,
          `Placeholder created successfully${this._topPlaceholder?.domElement ? " (has domElement)" : " (no domElement)"}`
        );
      } catch (error: unknown) {
        logError(
          LOG_SOURCE,
          error,
          "Error creating placeholder - custom scripts may be disabled"
        );
        return;
      }

      // The extension should not assume that the expected placeholder is available.
      if (!this._topPlaceholder) {
        const error = new Error(
          "The expected placeholder (Top) was not found. This may indicate custom scripts are disabled."
        );
        Log.error(LOG_SOURCE, error);
        logError(
          LOG_SOURCE,
          error,
          "Placeholder not available - check if custom scripts are enabled"
        );
        return;
      }
    }

    // Check if domElement is available
    if (!this._topPlaceholder.domElement) {
      Log.warn(LOG_SOURCE, "domElement is not available on placeholder");
      return;
    }

    // Check React availability before rendering
    const reactAvailable = typeof React !== "undefined";
    const reactDomAvailable = typeof ReactDom !== "undefined";
    const navbarAvailable = typeof Navbar !== "undefined";

    if (!reactAvailable || !reactDomAvailable || !navbarAvailable) {
      const missing = [
        !reactAvailable && "React",
        !reactDomAvailable && "ReactDom",
        !navbarAvailable && "Navbar",
      ]
        .filter(Boolean)
        .join(", ");
      const error = new Error(
        `Required dependencies not available: ${missing}. This may indicate a build or loading issue.`
      );
      logError(LOG_SOURCE, error, "Cannot render - missing dependencies");
      return;
    }

    Log.verbose(
      LOG_SOURCE,
      "All dependencies available, proceeding with render"
    );

    // Inject style overrides for navbar border and panel positioning
    // Ensure theme variables are inherited from SharePoint
    if (!document.getElementById(APPLICATION_CUSTOMIZER_STYLE_ID)) {
      const style = document.createElement("style");
      style.id = APPLICATION_CUSTOMIZER_STYLE_ID;
      style.textContent = getApplicationCustomizerStyles();
      document.head.appendChild(style);
    }

    // Render React immediately
    try {
      // Unmount any existing content before mounting (safety check)
      if (this._topPlaceholder.domElement && this._isReactMounted) {
        try {
          // eslint-disable-next-line @rushstack/pair-react-dom-render-unmount -- Unmounting before re-mounting, lifecycle handled in _onDispose
          ReactDom.unmountComponentAtNode(this._topPlaceholder.domElement);
        } catch (unmountError: unknown) {
          // Ignore unmount errors - element might not have React content
          const unmountErrorMsg =
            unmountError instanceof Error
              ? unmountError.message
              : String(unmountError);
          Log.verbose(
            LOG_SOURCE,
            `Unmount error (expected if not mounted): ${unmountErrorMsg}`
          );
        }
      }

      // Create React element with proper typing, wrapped in ErrorBoundary
      const navbarElement: React.ReactElement<INavbarProps> =
        React.createElement<INavbarProps>(Navbar, { context: this.context });

      const element: React.ReactElement = React.createElement(ErrorBoundary, {
        children: navbarElement,
      });

      // eslint-disable-next-line @rushstack/pair-react-dom-render-unmount -- Unmount handled in _onDispose method
      ReactDom.render(element, this._topPlaceholder.domElement);
      this._isReactMounted = true;
      Log.info(
        LOG_SOURCE,
        `React component successfully rendered (Top placeholder${this._topPlaceholder.domElement ? ", has domElement" : ""})`
      );
    } catch (renderError: unknown) {
      this._isReactMounted = false;
      const errorDetails = [
        this._topPlaceholder ? "hasPlaceholder" : "noPlaceholder",
        this._topPlaceholder?.domElement ? "hasDomElement" : "noDomElement",
        this._isReactMounted ? "wasMounted" : "notMounted",
      ].join(", ");
      logError(
        LOG_SOURCE,
        renderError,
        `Error rendering React component - page may freeze if this error persists (${errorDetails})`
      );
    }
  }

  private _onDispose(): void {
    // Clean up React component when placeholder is disposed
    if (
      this._topPlaceholder &&
      this._topPlaceholder.domElement &&
      this._isReactMounted
    ) {
      try {
        // eslint-disable-next-line @rushstack/pair-react-dom-render-unmount -- Paired with render in _renderPlaceHolders
        ReactDom.unmountComponentAtNode(this._topPlaceholder.domElement);
        this._isReactMounted = false;
        Log.verbose(LOG_SOURCE, "React component unmounted");
      } catch (error: unknown) {
        logError(LOG_SOURCE, error, "Error unmounting React component");
        this._isReactMounted = false;
      }
    }
  }

  public onDispose(): void {
    Log.info(LOG_SOURCE, `Disposed ${strings.Title}`);
    this._onDispose();
  }
}
