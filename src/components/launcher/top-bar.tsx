import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useClock } from '@/hooks/use-clock';
import { useScreenDimensions } from '@/hooks/use-screen-dimensions';
import { useTheme } from '@/hooks/use-theme';
import Launcher from '@/modules/launcher';

export function TopBar() {
  const now = useClock();
  const theme = useTheme();
  const styles = useStyles();
  const { scale } = useScreenDimensions();

  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={styles.bar}>
      <ThemedText type="subtitle">Home</ThemedText>

      <View style={styles.right}>
        <View style={styles.clock}>
          <ThemedText type="subtitle">{time}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {date}
          </ThemedText>
        </View>

        {Launcher ? (
          <Pressable
            onPress={() => Launcher?.openSettings()}
            accessibilityLabel="Settings"
            style={({ focused }) => [
              styles.settings,
              { backgroundColor: focused ? theme.text : theme.backgroundElement },
            ]}
          >
            {({ focused }) => (
              <Ionicons
                name="settings-outline"
                size={24 * scale}
                color={focused ? theme.background : theme.text}
              />
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const useStyles = () => {
  const { spacing } = useScreenDimensions();
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.five,
      paddingVertical: spacing.three,
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.four,
    },
    clock: {
      alignItems: 'flex-end',
    },
    settings: {
      padding: spacing.two,
      borderRadius: 999,
    },
  });
};
