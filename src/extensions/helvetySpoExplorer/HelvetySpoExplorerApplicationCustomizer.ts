import { Log } from '@microsoft/sp-core-library';
import {
  BaseApplicationCustomizer,
  PlaceholderContent,
  PlaceholderName
} from '@microsoft/sp-application-base';

import * as strings from 'HelvetySpoExplorerApplicationCustomizerStrings';

// Import React
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Navbar } from '../../components/Navbar/Navbar';
import { INavbarProps } from '../../types/ComponentProps';
import { ErrorBoundary } from '../../components/ErrorBoundary/ErrorBoundary';
import { logError } from '../../utils/errorUtils';
import { getApplicationCustomizerStyles, APPLICATION_CUSTOMIZER_STYLE_ID } from '../../utils/applicationCustomizerStyles';

const LOG_SOURCE: string = 'HelvetySpoExplorerApplicationCustomizer';

/**
 * If your command set uses the ClientSideComponentProperties JSON input,
 * it will be deserialized into the BaseExtension.properties object.
 * You can define an interface to describe it.
 */
export interface IHelvetySpoExplorerApplicationCustomizerProperties {
  // No properties needed for this extension
}

/** A Custom Action which can be run during execution of a Client Side Application */
export default class HelvetySpoExplorerApplicationCustomizer
  extends BaseApplicationCustomizer<IHelvetySpoExplorerApplicationCustomizerProperties> {

  private _topPlaceholder: PlaceholderContent | undefined;

  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, `Initialized ${strings.Title}`);

    try {
      // Register for placeholder changes
      this.context.placeholderProvider.changedEvent.add(this, this._renderPlaceHolders);

      // Render placeholders
      this._renderPlaceHolders();
    } catch (error: unknown) {
      logError(LOG_SOURCE, error, 'Error in onInit');
    }

    return Promise.resolve();
  }

  private _renderPlaceHolders(): void {
    // Check if the top placeholder is already registered and available
    if (!this._topPlaceholder) {
      if (!this.context.placeholderProvider) {
        Log.error(LOG_SOURCE, new Error('PlaceholderProvider is not available'));
        return;
      }

      try {
        this._topPlaceholder = this.context.placeholderProvider.tryCreateContent(
          PlaceholderName.Top,
          { onDispose: this._onDispose }
        );
      } catch (error: unknown) {
        logError(LOG_SOURCE, error, 'Error creating placeholder');
        return;
      }

      // The extension should not assume that the expected placeholder is available.
      if (!this._topPlaceholder) {
        Log.error(LOG_SOURCE, new Error('The expected placeholder (Top) was not found.'));
        return;
      }

      if (this._topPlaceholder.domElement) {
        // Check React availability before rendering
        if (typeof React === 'undefined' || typeof ReactDom === 'undefined' || typeof Navbar === 'undefined') {
          logError(LOG_SOURCE, new Error('React, ReactDom, or Navbar component is not available'));
          return;
        }

        // Inject style overrides for navbar border and panel positioning
        // Ensure theme variables are inherited from SharePoint
        if (!document.getElementById(APPLICATION_CUSTOMIZER_STYLE_ID)) {
          const style = document.createElement('style');
          style.id = APPLICATION_CUSTOMIZER_STYLE_ID;
          style.textContent = getApplicationCustomizerStyles();
          document.head.appendChild(style);
        }

        try {
          // Create React element with proper typing, wrapped in ErrorBoundary
          const navbarElement: React.ReactElement<INavbarProps> = React.createElement<INavbarProps>(
            Navbar,
            { context: this.context }
          );
          
          const element: React.ReactElement = React.createElement(
            ErrorBoundary,
            { children: navbarElement }
          );
          
          ReactDom.render(element, this._topPlaceholder.domElement);
        } catch (renderError: unknown) {
          logError(LOG_SOURCE, renderError, 'Error rendering React component');
        }
      } else {
        logError(LOG_SOURCE, new Error('domElement is not available on placeholder'));
      }
    }
  }

  private _onDispose(): void {
    // Clean up React component when placeholder is disposed
    if (this._topPlaceholder && this._topPlaceholder.domElement) {
      try {
        ReactDom.unmountComponentAtNode(this._topPlaceholder.domElement);
      } catch (error: unknown) {
        logError(LOG_SOURCE, error, 'Error unmounting React component');
      }
    }
  }

  public onDispose(): void {
    Log.info(LOG_SOURCE, `Disposed ${strings.Title}`);
    this._onDispose();
  }
}
