import { NativeModule, requireOptionalNativeModule } from 'expo';

export type InstalledApp = {
  packageName: string;
  activityName: string;
  label: string;
  /** file:// URI of the app's TV banner (16:9), if it has one. */
  banner: string | null;
  /** file:// URI of the app's icon. */
  icon: string | null;
};

type LauncherEvents = {
  onAppsChanged: () => void;
};

declare class LauncherModule extends NativeModule<LauncherEvents> {
  getInstalledApps(): Promise<InstalledApp[]>;
  launchApp(packageName: string, activityName: string): void;
  openSettings(): void;
}

/** Only available on Android; null on other platforms. */
export default requireOptionalNativeModule<LauncherModule>('Launcher');
