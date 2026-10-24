import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { CrtOverlay } from '@/components/amiga/crt-overlay';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={styles.root}>
        <Stack screenOptions={{ headerShown: false }} />
        <CrtOverlay />
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
