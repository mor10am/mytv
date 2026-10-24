#!/usr/bin/env bash
# Installs mytv as the home launcher on an Android TV device or emulator.
# Run with --help for options.
set -euo pipefail

cd "$(dirname "$0")/.."

# Stock launchers we turn off so Home always lands in mytv.
STOCK_LAUNCHERS=(
  com.google.android.tvlauncher          # Android TV
  com.google.android.apps.tv.launcherx   # Google TV
  com.google.android.leanbacklauncher    # older Android TV / AOSP
)

# Google Assistant apps we turn off so the TV never listens for "Hey Google".
VOICE_ASSISTANTS=(
  com.google.android.katniss             # Android TV / Google TV assistant
  com.google.android.googlequicksearchbox  # Google app, on some TVs
)
ASSISTANT_ROLE=android.app.role.ASSISTANT

usage() {
  cat <<'EOF'
Usage: scripts/install-launcher.sh [options]

Builds mytv, installs it on a device, makes it the home app and turns off
the stock launcher and Google Assistant ("Hey Google").

Options:
  -s, --serial SERIAL  Device to use (as shown by `adb devices`).
                       Default: the only connected device, or ask.
      --apk PATH       Install this APK instead of building one
                       (for example an APK from an EAS build).
      --debug          Build a debug APK instead of release. Debug builds load
                       JavaScript from Metro, so run `pnpm start` too.
      --skip-build     Install the APK from the last build without rebuilding.
      --restore        Undo: turn the stock launcher and Google Assistant back
                       on and make the stock launcher the home app again.
                       mytv stays installed.
  -h, --help           Show this help.
EOF
}

die() { echo "error: $*" >&2; exit 1; }
step() { echo; echo "==> $*"; }

SERIAL=""
APK=""
VARIANT="release"
SKIP_BUILD=0
RESTORE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    -s|--serial) SERIAL="${2:-}"; [[ -n "$SERIAL" ]] || die "--serial needs a value"; shift 2 ;;
    --apk) APK="${2:-}"; [[ -n "$APK" ]] || die "--apk needs a path"; shift 2 ;;
    --debug) VARIANT="debug"; shift ;;
    --skip-build) SKIP_BUILD=1; shift ;;
    --restore) RESTORE=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) usage >&2; die "unknown option: $1" ;;
  esac
done

command -v adb >/dev/null || die "adb not found. Install the Android SDK platform-tools and add them to PATH."
command -v node >/dev/null || die "node not found."
command -v pnpm >/dev/null || die "pnpm not found. Install it with: npm install -g pnpm"

PACKAGE=$(node -p "require('./app.json').expo.android.package")
HOME_ACTIVITY="$PACKAGE/.MainActivity"

# --- Pick a device ------------------------------------------------------------

pick_device() {
  local serials=() labels=() serial state rest model
  while read -r serial state rest; do
    [[ -z "$serial" || "$serial" == "List" ]] && continue
    if [[ "$state" != "device" ]]; then
      echo "skipping $serial ($state)" >&2
      continue
    fi
    model=$(sed -n 's/.*model:\([^ ]*\).*/\1/p' <<<"$rest")
    serials+=("$serial")
    labels+=("$serial  ${model:-unknown}")
  done < <(adb devices -l)

  case ${#serials[@]} in
    0) die "no devices found. Start an emulator or connect a TV (adb connect <ip>:5555)." ;;
    1) SERIAL="${serials[0]}" ;;
    *)
      echo "Select a device:" >&2
      local PS3="Device number: "
      select label in "${labels[@]}"; do
        [[ -n "${label:-}" ]] && { SERIAL="${serials[REPLY-1]}"; break; }
      done
      [[ -n "$SERIAL" ]] || die "no device selected"
      ;;
  esac
}

[[ -n "$SERIAL" ]] || pick_device
ADB=(adb -s "$SERIAL")
"${ADB[@]}" get-state >/dev/null 2>&1 || die "device $SERIAL is not available"
echo "Using device: $SERIAL ($("${ADB[@]}" shell getprop ro.product.model | tr -d '\r'))"

installed() { "${ADB[@]}" shell pm path "$1" >/dev/null 2>&1; }

# --- Restore ------------------------------------------------------------------

if [[ $RESTORE -eq 1 ]]; then
  step "Turning stock launchers back on"
  restored=""
  for pkg in "${STOCK_LAUNCHERS[@]}"; do
    installed "$pkg" || continue
    "${ADB[@]}" shell pm enable "$pkg" >/dev/null && echo "enabled $pkg"
    restored="${restored:-$pkg}"
  done
  [[ -n "$restored" ]] || die "no known stock launcher found on this device"

  step "Turning Google Assistant back on"
  for pkg in "${VOICE_ASSISTANTS[@]}"; do
    installed "$pkg" || continue
    "${ADB[@]}" shell pm enable "$pkg" >/dev/null
    "${ADB[@]}" shell appops set --uid "$pkg" RECORD_AUDIO foreground || true
    # Making it the assistant again also restores the voice settings.
    "${ADB[@]}" shell cmd role add-role-holder --user 0 "$ASSISTANT_ROLE" "$pkg" || true
    echo "enabled $pkg"
  done

  activity=$("${ADB[@]}" shell cmd package resolve-activity --brief \
    -a android.intent.action.MAIN -c android.intent.category.HOME "$restored" | tail -1 | tr -d '\r')
  "${ADB[@]}" shell cmd package set-home-activity "$activity" >/dev/null \
    || echo "Could not set the home app. Press Home on the device and pick the stock launcher."
  "${ADB[@]}" shell input keyevent KEYCODE_HOME
  echo "Done. Home now opens $restored."
  exit 0
fi

# --- Build --------------------------------------------------------------------

if [[ -z "$APK" ]]; then
  APK="android/app/build/outputs/apk/$VARIANT/app-$VARIANT.apk"
  if [[ $SKIP_BUILD -eq 0 ]]; then
    step "Generating the Android TV project (expo prebuild)"
    EXPO_TV=1 pnpm exec expo prebuild --clean --platform android --no-install

    step "Building $VARIANT APK"
    task="assemble${VARIANT^}"
    (cd android && ./gradlew "$task")
  fi
fi
[[ -f "$APK" ]] || die "APK not found: $APK"

# --- Install and make it the launcher -----------------------------------------

step "Installing $APK"
"${ADB[@]}" install -r "$APK"

if [[ "$VARIANT" == "debug" ]]; then
  # Lets the device reach Metro on this machine at localhost:8081.
  "${ADB[@]}" reverse tcp:8081 tcp:8081 >/dev/null || true
fi

step "Setting mytv as the home app"
if ! "${ADB[@]}" shell cmd package set-home-activity "$HOME_ACTIVITY"; then
  echo "Could not set the home app automatically. Press Home on the device and pick mytv."
fi

step "Turning off stock launchers"
for pkg in "${STOCK_LAUNCHERS[@]}"; do
  installed "$pkg" || continue
  if "${ADB[@]}" shell pm disable-user --user 0 "$pkg" >/dev/null 2>&1; then
    echo "disabled $pkg"
  else
    echo "could not disable $pkg (this device may not allow it)"
  fi
done

step "Turning off Google Assistant (\"Hey Google\")"
for pkg in "${VOICE_ASSISTANTS[@]}"; do
  installed "$pkg" || continue
  "${ADB[@]}" shell cmd role remove-role-holder --user 0 "$ASSISTANT_ROLE" "$pkg" || true
  # Block the microphone too, in case the app gets turned back on.
  "${ADB[@]}" shell appops set --uid "$pkg" RECORD_AUDIO ignore || true
  if "${ADB[@]}" shell pm disable-user --user 0 "$pkg" >/dev/null 2>&1; then
    echo "disabled $pkg"
  else
    echo "could not disable $pkg (this device may not allow it)"
  fi
done
# No voice assistant at all, so nothing listens for the hotword.
"${ADB[@]}" shell settings put secure voice_interaction_service "''"
"${ADB[@]}" shell settings put secure assistant "''"
if "${ADB[@]}" shell dumpsys voiceinteraction | grep -q "No active implementation"; then
  echo "No voice assistant is active."
else
  echo "A voice assistant is still active. Check: adb shell dumpsys voiceinteraction"
fi

step "Checking"
"${ADB[@]}" shell input keyevent KEYCODE_HOME
home=$("${ADB[@]}" shell cmd package resolve-activity --brief \
  -a android.intent.action.MAIN -c android.intent.category.HOME | tail -1 | tr -d '\r')
if [[ "$home" == "$PACKAGE/"* ]]; then
  echo "Home opens mytv ($home)."
else
  echo "Home opens $home, not mytv. Press Home on the device and pick mytv."
  exit 1
fi
