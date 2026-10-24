import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { AmigaText } from '@/components/amiga/amiga-text';
import { BoingBall } from '@/components/amiga/boing-ball';
import { ScreenBar } from '@/components/amiga/screen-bar';
import { ShellWindow } from '@/components/amiga/shell-window';
import { AmigaWindow, type ScrollPosition } from '@/components/amiga/window';
import { DesktopIcon } from '@/components/launcher/desktop-icon';
import { Amiga } from '@/constants/amiga';
import { useAmigaMetrics } from '@/hooks/use-amiga-metrics';
import { useBootMessages } from '@/hooks/use-boot-messages';
import { useInstalledApps } from '@/hooks/use-installed-apps';
import Launcher, { type InstalledApp } from '@/modules/launcher';

const COLUMNS = 6;

type DesktopItem = { kind: 'app'; app: InstalledApp } | { kind: 'prefs' };

export default function LauncherScreen() {
  const { apps, loading, supported } = useInstalledApps();
  const { spacing } = useAmigaMetrics();
  const [gridWidth, setGridWidth] = useState(0);
  const { scroll, onLayout, onScroll, onContentSizeChange } = useScrollPosition();
  useBootMessages({ appCount: apps.length, loading, supported });

  // This is the home screen: Back should never close it.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // Apps first, then a Prefs icon that opens Android settings.
  const items = useMemo<DesktopItem[]>(
    () => [
      ...apps.map((app) => ({ kind: 'app' as const, app })),
      ...(Launcher ? [{ kind: 'prefs' as const }] : []),
    ],
    [apps],
  );

  const cellWidth = (gridWidth - spacing.three * 2) / COLUMNS;

  const renderItem = useCallback(
    ({ item, index }: { item: DesktopItem; index: number }) =>
      item.kind === 'app' ? (
        <DesktopIcon
          label={item.app.label}
          width={cellWidth}
          preferredFocus={index === 0}
          onPress={() => Launcher?.launchApp(item.app.packageName, item.app.activityName)}
        >
          {(size) => (
            <Image
              source={{ uri: item.app.icon ?? item.app.banner ?? undefined }}
              style={{ width: size, height: size }}
              contentFit="contain"
            />
          )}
        </DesktopIcon>
      ) : (
        <DesktopIcon
          label="Prefs"
          width={cellWidth}
          preferredFocus={index === 0}
          onPress={() => Launcher?.openSettings()}
        >
          {(size, focused) => (
            <Ionicons
              name="settings-sharp"
              size={size * 0.8}
              color={focused ? Amiga.white : Amiga.black}
            />
          )}
        </DesktopIcon>
      ),
    [cellWidth],
  );

  return (
    <View style={styles.screen}>
      <ScreenBar appCount={apps.length} />

      <View style={styles.workbench}>
        <AmigaWindow title="Workbench" scroll={scroll}>
          <View
            style={styles.content}
            onLayout={(e) => {
              setGridWidth(e.nativeEvent.layout.width);
              onLayout(e);
            }}
          >
            {!supported ? (
              <AmigaText style={[styles.message, { marginTop: spacing.six }]}>
                App list is only available on Android.
              </AmigaText>
            ) : loading ? (
              <ActivityIndicator color={Amiga.black} style={{ marginTop: spacing.six }} />
            ) : gridWidth > 0 ? (
              <FlatList
                data={items}
                keyExtractor={(item) => (item.kind === 'app' ? item.app.packageName : 'prefs')}
                numColumns={COLUMNS}
                contentContainerStyle={{ padding: spacing.three }}
                renderItem={renderItem}
                onScroll={onScroll}
                scrollEventThrottle={32}
                onContentSizeChange={onContentSizeChange}
                showsVerticalScrollIndicator={false}
              />
            ) : null}
          </View>
        </AmigaWindow>
      </View>

      {/* Drawn before the shell window so the ball bounces behind it. */}
      <BoingBall />

      <View style={styles.shell}>
        <ShellWindow />
      </View>
    </View>
  );
}

/** Tracks which part of the list is visible, for the window's scrollbar knob. */
function useScrollPosition() {
  const [scroll, setScroll] = useState<ScrollPosition>({ start: 0, size: 1 });
  const metrics = useRef({ offset: 0, content: 0, visible: 0 });

  const update = useCallback(() => {
    const { offset, content, visible } = metrics.current;
    if (content <= 0 || visible <= 0) return;
    const size = Math.min(1, visible / content);
    const start = Math.min(1 - size, Math.max(0, offset / content));
    // Skip tiny changes so scrolling doesn't re-render on every frame.
    setScroll((prev) =>
      Math.abs(prev.start - start) < 0.005 && Math.abs(prev.size - size) < 0.005
        ? prev
        : { start, size },
    );
  }, []);

  return {
    scroll,
    onLayout: useCallback(
      (e: LayoutChangeEvent) => {
        metrics.current.visible = e.nativeEvent.layout.height;
        update();
      },
      [update],
    ),
    onScroll: useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        metrics.current.offset = e.nativeEvent.contentOffset.y;
        update();
      },
      [update],
    ),
    onContentSizeChange: useCallback(
      (_w: number, h: number) => {
        metrics.current.content = h;
        update();
      },
      [update],
    ),
  };
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Amiga.gray,
  },
  workbench: {
    flex: 3,
  },
  shell: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  message: {
    textAlign: 'center',
  },
});
