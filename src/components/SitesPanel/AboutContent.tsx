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
 * AboutContent component - displays app description, contact, version and build date
 */
export const AboutContent: React.FC = React.memo(() => {
  const builtOnDisplay = BUILD_DATE
    ? `${UI_MESSAGES.ABOUT_BUILT_ON} ${BUILD_DATE}`
    : UI_MESSAGES.ABOUT_NOT_AVAILABLE;

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
        <p id="about-app-description" style={settingsSectionDescriptionStyles}>
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
});

AboutContent.displayName = "AboutContent";
