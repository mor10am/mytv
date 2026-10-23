import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useScreenDimensions } from '@/hooks/use-screen-dimensions';
import { useTheme } from '@/hooks/use-theme';
import type { InstalledApp } from '@/modules/launcher';

type Props = {
  app: InstalledApp;
  width: number;
  preferredFocus?: boolean;
  onPress: () => void;
};

/** A 16:9 tile: the app's TV banner if it has one, otherwise its icon. */
export function AppTile({ app, width, preferredFocus, onPress }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const height = (width * 9) / 16;

  return (
    <Pressable
      onPress={onPress}
      hasTVPreferredFocus={preferredFocus}
      accessibilityLabel={app.label}
      style={({ focused }) => [
        styles.tile,
        { width },
        focused && { transform: [{ scale: 1.08 }], zIndex: 1 },
      ]}
    >
      {({ focused }) => (
        <>
          <View
            style={[
              styles.art,
              {
                height,
                backgroundColor: theme.backgroundElement,
                borderColor: focused ? theme.text : 'transparent',
              },
            ]}
          >
            {app.banner ? (
              <Image source={{ uri: app.banner }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : app.icon ? (
              <Image
                source={{ uri: app.icon }}
                style={{ width: height * 0.55, height: height * 0.55 }}
                contentFit="contain"
              />
            ) : null}
          </View>
          <ThemedText
            type="small"
            numberOfLines={1}
            themeColor={focused ? 'text' : 'textSecondary'}
            style={styles.label}
          >
            {app.label}
          </ThemedText>
        </>
      )}
    </Pressable>
  );
}

const useStyles = () => {
  const { spacing } = useScreenDimensions();
  return StyleSheet.create({
    tile: {
      gap: spacing.one,
    },
    art: {
      borderRadius: spacing.two,
      borderWidth: 3,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      textAlign: 'center',
    },
  });
};
