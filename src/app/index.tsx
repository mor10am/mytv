import { useEffect } from 'react';
import { ActivityIndicator, BackHandler, FlatList, StyleSheet } from 'react-native';

import { AppTile } from '@/components/launcher/app-tile';
import { TopBar } from '@/components/launcher/top-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useInstalledApps } from '@/hooks/use-installed-apps';
import { useScreenDimensions } from '@/hooks/use-screen-dimensions';
import Launcher from '@/modules/launcher';

const COLUMNS = 5;

export default function LauncherScreen() {
  const { apps, loading, supported } = useInstalledApps();
  const { width, spacing } = useScreenDimensions();
  const styles = useStyles();

  // This is the home screen: Back should never close it.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const gap = spacing.four;
  const tileWidth = (width - spacing.five * 2 - gap * (COLUMNS - 1)) / COLUMNS;

  return (
    <ThemedView style={styles.container}>
      <TopBar />

      {!supported ? (
        <ThemedText style={styles.message}>App list is only available on Android.</ThemedText>
      ) : loading ? (
        <ActivityIndicator style={styles.message} />
      ) : (
        <FlatList
          data={apps}
          keyExtractor={(app) => app.packageName}
          numColumns={COLUMNS}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap }}
          ListHeaderComponent={<ThemedText type="smallBold">Apps</ThemedText>}
          renderItem={({ item, index }) => (
            <AppTile
              app={item}
              width={tileWidth}
              preferredFocus={index === 0}
              onPress={() => Launcher?.launchApp(item.packageName, item.activityName)}
            />
          )}
        />
      )}
    </ThemedView>
  );
}

const useStyles = () => {
  const { spacing } = useScreenDimensions();
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    grid: {
      paddingHorizontal: spacing.five,
      paddingTop: spacing.two,
      paddingBottom: spacing.five,
      gap: spacing.four,
    },
    message: {
      marginTop: spacing.six,
      textAlign: 'center',
    },
  });
};
