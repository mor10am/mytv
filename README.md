# mytv

A home screen (launcher) for Android TV. It replaces the stock TV launcher, so pressing Home on the remote opens mytv.

- **Top bar:** the title, the current time and date, and a Settings button that opens Android's system Settings.
- **App grid:** every installed app you can open, five per row. TV apps show their banner and other apps show their icon. Use the remote to move between tiles and press OK to open one.
- The list updates when apps are installed or removed.
- Back does nothing on the home screen, so you can't leave the launcher by accident.

Built with Expo (SDK 57), Expo Router and [react-native-tvos](https://github.com/react-native-tvos/react-native-tvos). The app ID is `com.amundsenhq.mytv` and the URL scheme is `mytv://`.

## Requirements

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 20 or newer | |
| pnpm | 10 or newer | `npm install -g pnpm` |
| JDK | **17** | Newer JDKs break the native build (see below). |
| Android SDK | Platform 36, platform-tools | Install with Android Studio or the command-line tools. Put `platform-tools` (`adb`) on your `PATH` and set `ANDROID_HOME`. |
| Device | Android TV, Android 7.0 (API 24) or newer | An Android TV emulator or a real TV with USB or network debugging turned on. |

### JDK 17

With Java 25, Android's Prefab tool prints a warning that makes the CMake setup of `react-native-worklets` and `react-native-screens` fail. On Ubuntu, install JDK 17 and make it the default:

```sh
sudo apt-get install openjdk-17-jdk
sudo update-java-alternatives --set java-1.17.0-openjdk-amd64
java -version    # should say 17
```

If `JAVA_HOME` is set, point it at JDK 17 (`/usr/lib/jvm/java-17-openjdk-amd64`) or unset it, since Gradle uses `JAVA_HOME` before the `java` on your `PATH`.

### A device

**Emulator:** in Android Studio, open Device Manager and create a device from the **TV** category (for example "Television (4K)") with an Android TV system image. Start it before installing.

**Real TV:** turn on Developer options (Settings → Device Preferences → About → click *Build* seven times), then turn on USB debugging or network debugging. For a TV on your network:

```sh
adb connect <tv-ip>:5555
```

Accept the prompt on the TV. `adb devices` should list the TV as `device`.

## Install mytv as the launcher

```sh
pnpm install
scripts/install-launcher.sh
```

The script:

1. Asks which device to use if more than one is connected.
2. Generates the Android TV project (`expo prebuild` with `EXPO_TV=1`).
3. Builds a release APK. It runs on its own and doesn't need your computer.
4. Installs the APK on the device.
5. Makes mytv the home app.
6. Turns off the stock launcher (Android TV's `com.google.android.tvlauncher`, Google TV's `com.google.android.apps.tv.launcherx` or AOSP's `com.google.android.leanbacklauncher`), so Home always opens mytv.
7. Presses Home and checks that mytv opens.

Options:

| Option | What it does |
| --- | --- |
| `-s, --serial SERIAL` | Use this device (as listed by `adb devices`) instead of asking. |
| `--apk PATH` | Install an APK you already have, such as one from an EAS build, instead of building one. |
| `--debug` | Build a debug APK. It loads JavaScript from Metro, so run `pnpm start` as well. |
| `--skip-build` | Install the APK from the last build. |
| `--restore` | Undo: turn the stock launcher back on and make it the home app again. mytv stays installed. |

Example: `scripts/install-launcher.sh -s emulator-5554`

Release builds are signed with the debug keystore. That's fine for installing on your own devices, but you'll need your own signing key before publishing to the Play Store.

### Doing it by hand

The script runs these steps. Use them if you want to see or change what it does:

```sh
EXPO_TV=1 pnpm exec expo prebuild --clean --platform android
(cd android && ./gradlew assembleRelease)
adb install -r android/app/build/outputs/apk/release/app-release.apk
adb shell cmd package set-home-activity com.amundsenhq.mytv/.MainActivity
adb shell pm disable-user --user 0 com.google.android.tvlauncher
adb shell input keyevent KEYCODE_HOME
```

To undo:

```sh
adb shell pm enable com.google.android.tvlauncher
adb shell cmd package set-home-activity com.google.android.tvlauncher/.MainActivity
```

If Android doesn't accept `set-home-activity`, press Home on the device and choose mytv when it asks.

### Building in the cloud with EAS

The `preview_tv` profile in `eas.json` builds a standalone APK for TV:

```sh
pnpm dlx eas-cli build --profile preview_tv --platform android
scripts/install-launcher.sh --apk path/to/downloaded.apk
```

## Development

```sh
pnpm install
pnpm prebuild:tv   # generate android/ for TV
pnpm android       # build a debug app, install it and start Metro
pnpm start         # start Metro on its own
```

After `pnpm android`, make it the home app with `scripts/install-launcher.sh --debug --skip-build`, or run the `set-home-activity` command above.

Debug builds open the Expo dev menu on launch. Close it with Back. Open it again with the remote's menu key or Ctrl+M.

Before committing:

```sh
pnpm exec tsc --noEmit
```

`android/` and `ios/` are generated by `expo prebuild` and aren't checked in. Change native settings in `app.json` or in a config plugin under `plugins/`, never by editing `android/` directly.

## How it works

| Path | What it is |
| --- | --- |
| `src/app/index.tsx` | The launcher screen: top bar and app grid. |
| `src/components/launcher/` | The top bar and app tile components. |
| `src/hooks/use-installed-apps.ts` | Loads the app list and keeps it up to date. `HIDDEN_PACKAGES` lists apps that are left out of the grid. |
| `src/hooks/use-clock.ts` | The current time, updated every minute. |
| `modules/launcher/` | A local Expo module (Kotlin) that lists launchable apps with their banners and icons, opens apps, opens system Settings, and reports when apps are installed or removed. Its `AndroidManifest.xml` declares `<queries>` so Android 11+ lets it see other apps. |
| `plugins/withHomeLauncher.js` | Config plugin that adds the `HOME` intent filter, so Android offers mytv as a home app. |
| `plugins/withHiddenDevMenuButton.js` | Config plugin that hides the Expo dev menu's floating button in debug builds. It would otherwise sit on top of the Settings button. |
| `scripts/install-launcher.sh` | Builds, installs and sets mytv as the launcher on a device. |

To hide an app from the grid, add its package name to `HIDDEN_PACKAGES` in `src/hooks/use-installed-apps.ts`. To find a package name, run `adb shell pm list packages`.
