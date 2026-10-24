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

export type MemoryInfo = {
  /** Bytes available to apps, as reported by ActivityManager. */
  availMem: number;
  /** Total bytes of RAM usable by the kernel. */
  totalMem: number;
  /** True when the system considers itself low on memory. */
  lowMemory: boolean;
};

export type StorageInfo = {
  /** Bytes free for apps on the internal data partition. */
  availBytes: number;
  /** Size in bytes of the internal data partition. */
  totalBytes: number;
};

type LauncherEvents = {
  onAppsChanged: () => void;
};

declare class LauncherModule extends NativeModule<LauncherEvents> {
  getInstalledApps(): Promise<InstalledApp[]>;
  launchApp(packageName: string, activityName: string): void;
  getMemoryInfo(): Promise<MemoryInfo>;
  getStorageInfo(): Promise<StorageInfo>;
  openSettings(): void;
}

/** Only available on Android; null on other platforms. */
export default requireOptionalNativeModule<LauncherModule>('Launcher');
