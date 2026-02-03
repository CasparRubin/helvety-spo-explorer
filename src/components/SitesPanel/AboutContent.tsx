// External dependencies
import * as React from "react";

// Constants
import { UI_MESSAGES } from "../../utils/constants";
import { APP_VERSION, BUILD_DATE } from "../../utils/buildInfo";

// Styles
import {
  settingsPanelContentStyles,
  settingsSectionStyles,
  settingsSectionHeaderStyles,
  settingsSectionDescriptionStyles,
} from "../../utils/styles";

/**
 * Props for the AboutContent component
 */
interface IAboutContentProps {
  /** Current license tier (e.g. helvety-spo-explorer-basic-monthly) */
  licenseTier?: string;
  /** SharePoint tenant ID */
  tenantId?: string;
}

/**
 * AboutContent component - displays app description, contact, license (tier and tenant), version and build date
 */
export const AboutContent: React.FC<IAboutContentProps> = React.memo(
  ({ licenseTier, tenantId }) => {
    const builtOnDisplay = BUILD_DATE
      ? `${UI_MESSAGES.ABOUT_BUILT_ON} ${BUILD_DATE}`
      : UI_MESSAGES.ABOUT_SUBSCRIPTION_NOT_AVAILABLE;

    return (
      <div
        style={settingsPanelContentStyles}
        role="region"
        aria-label="About Helvety SPO Explorer"
      >
        <section
          style={settingsSectionStyles}
          aria-labelledby="about-app-header"
          aria-describedby="about-app-description"
        >
          <h3 id="about-app-header" style={settingsSectionHeaderStyles}>
            Helvety SPO Explorer
          </h3>
          <p
            id="about-app-description"
            style={settingsSectionDescriptionStyles}
          >
            {UI_MESSAGES.ABOUT_APP_DESCRIPTION}
          </p>
        </section>

        <section
          style={settingsSectionStyles}
          aria-labelledby="about-contact-header"
        >
          <h3 id="about-contact-header" style={settingsSectionHeaderStyles}>
            {UI_MESSAGES.ABOUT_CONTACT_LABEL}
          </h3>
          <p style={settingsSectionDescriptionStyles}>
            <a href={`mailto:${UI_MESSAGES.ABOUT_CONTACT_EMAIL}`}>
              {UI_MESSAGES.ABOUT_CONTACT_EMAIL}
            </a>
          </p>
        </section>

        <section
          style={settingsSectionStyles}
          aria-labelledby="about-license-header"
        >
          <h3 id="about-license-header" style={settingsSectionHeaderStyles}>
            License
          </h3>
          <p style={settingsSectionDescriptionStyles}>
            <strong>{UI_MESSAGES.ABOUT_LICENSE_TIER}:</strong>{" "}
            {licenseTier ?? UI_MESSAGES.ABOUT_SUBSCRIPTION_NOT_AVAILABLE}
            <br />
            <strong>{UI_MESSAGES.ABOUT_TENANT}:</strong>{" "}
            {tenantId ?? UI_MESSAGES.ABOUT_SUBSCRIPTION_NOT_AVAILABLE}
          </p>
        </section>

        <section
          style={settingsSectionStyles}
          aria-labelledby="about-version-header"
        >
          <h3 id="about-version-header" style={settingsSectionHeaderStyles}>
            {UI_MESSAGES.ABOUT_VERSION}
          </h3>
          <p style={settingsSectionDescriptionStyles}>{APP_VERSION}</p>
        </section>

        <section
          style={settingsSectionStyles}
          aria-labelledby="about-built-header"
        >
          <h3 id="about-built-header" style={settingsSectionHeaderStyles}>
            {UI_MESSAGES.ABOUT_BUILT_ON}
          </h3>
          <p style={settingsSectionDescriptionStyles}>{builtOnDisplay}</p>
        </section>
      </div>
    );
  },
  (prevProps: IAboutContentProps, nextProps: IAboutContentProps): boolean => {
    return (
      prevProps.licenseTier === nextProps.licenseTier &&
      prevProps.tenantId === nextProps.tenantId
    );
  }
);

AboutContent.displayName = "AboutContent";
