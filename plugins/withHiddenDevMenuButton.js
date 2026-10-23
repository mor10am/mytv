// Hides the Expo dev menu's floating button in debug builds. It sits in the top-right
// corner, on top of the launcher's Settings button. The dev menu still opens via the
// remote's menu key or Ctrl+M.
const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins');

module.exports = function withHiddenDevMenuButton(config) {
  return withAndroidManifest(config, (config) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      app,
      'EXDevMenuShowFloatingActionButton',
      'false'
    );
    return config;
  });
};
