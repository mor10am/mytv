import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import Launcher, { type InstalledApp } from '@/modules/launcher';

/** Apps hidden from the launcher, by package name (phone and Android TV variants). */
const HIDDEN_PACKAGES = new Set([
  // Play Games
  'com.google.android.play.games',
  // Settings
  'com.android.settings',
  'com.android.tv.settings',
  // YouTube Music
  'com.google.android.apps.youtube.music',
  'com.google.android.youtube.tvmusic',
]);

/** Launchable apps on the device. Refreshes on install/uninstall and when the launcher comes back. */
export function useInstalledApps() {
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(Launcher != null);

  const refresh = useCallback(async () => {
    if (!Launcher) return;
    try {
      const all = await Launcher.getInstalledApps();
      setApps(all.filter((app) => !HIDDEN_PACKAGES.has(app.packageName)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const changed = Launcher?.addListener('onAppsChanged', refresh);
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      changed?.remove();
      appState.remove();
    };
  }, [refresh]);

  return { apps, loading, supported: Launcher != null };
}
