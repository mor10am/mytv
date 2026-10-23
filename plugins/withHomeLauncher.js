// Registers MainActivity as a HOME app, so Android (TV) can use it as the launcher.
const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins');

const HOME_FILTER = {
  action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
  category: [
    { $: { 'android:name': 'android.intent.category.HOME' } },
    { $: { 'android:name': 'android.intent.category.DEFAULT' } },
  ],
};

function isHomeFilter(filter) {
  return (filter.category ?? []).some(
    (c) => c.$['android:name'] === 'android.intent.category.HOME'
  );
}

module.exports = function withHomeLauncher(config) {
  return withAndroidManifest(config, (config) => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);
    activity['intent-filter'] = activity['intent-filter'] ?? [];
    if (!activity['intent-filter'].some(isHomeFilter)) {
      activity['intent-filter'].push(HOME_FILTER);
    }
    return config;
  });
};
