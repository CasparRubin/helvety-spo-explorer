// This file is optional - SPFx will use it if present
// For PostCSS/Tailwind processing, we'll rely on the CSS import in components
// If needed, you can eject webpack using: npm run eject-webpack

/**
 * Webpack configuration function
 * @param {object} env - Environment variables
 * @param {object} argv - Command line arguments
 * @param {object} webpackConfig - SPFx's default webpack configuration (merged automatically)
 * @returns {object} Webpack configuration to merge with SPFx defaults
 */
module.exports = (env, argv, webpackConfig) => {
  // SPFx automatically merges this config with its defaults
  // Return empty config to use SPFx defaults
  // The build system handles module resolution automatically
  // Custom webpack config can interfere with SPFx's module resolution in watch mode
  return {};
};
