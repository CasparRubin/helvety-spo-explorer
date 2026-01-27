/**
 * Application Customizer Styles
 * 
 * Contains CSS styles injected into the document head for the SharePoint
 * Application Customizer. These styles override default SharePoint styles
 * to ensure proper integration with the SharePoint theme and UI.
 * 
 * These styles are injected dynamically when the Application Customizer initializes.
 */

/**
 * CSS styles for the Application Customizer
 * 
 * Includes:
 * - Navbar border overrides
 * - Panel positioning and animation overrides
 * - Split button styling
 * - Scrollbar styling for sites list
 * - Refresh button animation
 * 
 * @returns CSS string to be injected into document head
 */
export function getApplicationCustomizerStyles(): string {
  return `
    .helvety-spo-navbar {
      border-bottom: none !important;
      /* Ensure theme variables are inherited */
      color: inherit;
    }
    .ms-SPLegacyFabricBlock .helvety-spo-navbar {
      border-bottom: none !important;
    }
    /* Scope panel positioning to our specific panel only using className */
    .helvety-spo-sites-panel.ms-Panel {
      left: 0 !important;
      right: auto !important;
    }
    .helvety-spo-sites-panel.ms-Panel .ms-Panel-main {
      left: 0 !important;
      right: auto !important;
    }
    /* Disable panel opening/closing animations */
    .helvety-spo-sites-panel.ms-Panel .ms-Panel-main {
      animation: none !important;
      transition: none !important;
    }
    /* Ensure split button menu button has proper border - target the menu button directly */
    .helvety-spo-navbar .ms-Button--default.ms-Button--split .ms-Button-splitButtonMenuButton,
    .helvety-spo-navbar .ms-Button--split button.ms-Button[aria-haspopup="true"],
    .helvety-spo-navbar .ms-Button--split .ms-Button-splitButtonMenuButton button,
    .ms-Button--default.ms-Button--split .ms-Button-splitButtonMenuButton,
    .ms-Button--split button.ms-Button[aria-haspopup="true"],
    .ms-Button--split .ms-Button-splitButtonMenuButton button {
      border: 1px solid var(--sp-color-neutral-2) !important;
      border-left: none !important;
    }
    /* Ensure the split button container maintains border on all sides */
    .helvety-spo-navbar .ms-Button--split .ms-Button-splitButtonContainer,
    .ms-Button--split .ms-Button-splitButtonContainer {
      border: 1px solid var(--sp-color-neutral-2) !important;
    }
    /* Ensure placeholder inherits SharePoint theme */
    [data-sp-placeholder] {
      color: inherit;
    }
    /* Disable scrolling on panel scrollableContent - let the table handle scrolling */
    .helvety-spo-sites-panel.ms-Panel .ms-Panel-scrollableContent {
      overflow: hidden !important;
    }
    .helvety-spo-sites-panel.ms-Panel .ms-Panel-content {
      overflow: hidden !important;
    }
    /* Ensure react-window list container has pointer events enabled */
    .helvety-spo-sites-panel .helvety-spo-sites-list-container {
      pointer-events: auto !important;
    }
    /* Ensure react-window list shows scrollbars */
    /* react-window creates an outer div and inner scrolling div - target both reliably */
    .helvety-spo-sites-panel .helvety-spo-sites-list-container [role="list"] {
      pointer-events: auto !important;
    }
    /* Target react-window's outer container (has height) */
    .helvety-spo-sites-panel .helvety-spo-sites-list-container [role="list"] > div {
      pointer-events: auto !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
    }
    /* Ensure all virtualized rows have pointer events */
    .helvety-spo-sites-panel .helvety-spo-sites-list-container [role="row"] {
      pointer-events: auto !important;
    }
    /* Ensure scrollbar is visible and styled */
    .helvety-spo-sites-panel .helvety-spo-sites-list-container [role="list"] > div::-webkit-scrollbar {
      width: 12px;
      display: block;
    }
    .helvety-spo-sites-panel .helvety-spo-sites-list-container [role="list"] > div::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
    }
    .helvety-spo-sites-panel .helvety-spo-sites-list-container [role="list"] > div::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 6px;
    }
    .helvety-spo-sites-panel .helvety-spo-sites-list-container [role="list"] > div::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.3);
    }
    /* For Firefox */
    .helvety-spo-sites-panel .helvety-spo-sites-list-container [role="list"] > div {
      scrollbar-width: thin;
      scrollbar-color: rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.05);
    }
    /* Refresh button spinning animation */
    @keyframes helvety-spo-refresh-spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
    .helvety-spo-sites-panel .helvety-spo-refresh-button-spinning .ms-Button-icon {
      animation: helvety-spo-refresh-spin 1s linear infinite;
      display: inline-block;
    }
  `;
}

/**
 * Style ID used for the injected style element
 */
export const APPLICATION_CUSTOMIZER_STYLE_ID = 'helvety-spo-overrides';
