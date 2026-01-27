// This file is optional - SPFx will use it if present
// For PostCSS/Tailwind processing, we'll rely on the CSS import in components
// If needed, you can eject webpack using: npm run eject-webpack

module.exports = (env, argv) => {
  // Return empty config - SPFx handles most webpack configuration
  // PostCSS processing should be handled by the build rig
  return {};
};
