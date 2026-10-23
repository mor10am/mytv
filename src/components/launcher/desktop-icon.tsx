import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AmigaText } from '@/components/amiga/amiga-text';
import { Bevel } from '@/components/amiga/bevel';
import { Amiga } from '@/constants/amiga';
import { useAmigaMetrics } from '@/hooks/use-amiga-metrics';

type Props = {
  label: string;
  /** Width of the grid cell. */
  width: number;
  preferredFocus?: boolean;
  onPress: () => void;
  /** Draws the picture inside the icon box. */
  children: (size: number, focused: boolean) => ReactNode;
};

/** A Workbench icon: a bevelled picture box with its name underneath. Focus shows it selected. */
export function DesktopIcon({ label, width, preferredFocus, onPress, children }: Props) {
  const { line, spacing } = useAmigaMetrics();
  const boxWidth = width * 0.62;
  const boxHeight = boxWidth * 0.72;

  return (
    <Pressable
      onPress={onPress}
      hasTVPreferredFocus={preferredFocus}
      accessibilityLabel={label}
      style={[styles.cell, { width, gap: spacing.one, paddingVertical: spacing.two }]}
    >
      {({ focused }) => (
        <>
          <Bevel
            recessed={focused}
            style={[
              styles.box,
              { width: boxWidth, height: boxHeight },
              focused && { backgroundColor: Amiga.blue },
            ]}
          >
            {children(boxHeight * 0.7, focused)}
          </Bevel>
          <AmigaText
            numberOfLines={1}
            style={[
              { maxWidth: width - spacing.two, paddingHorizontal: line * 2 },
              focused && styles.selectedLabel,
            ]}
          >
            {label}
          </AmigaText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
  },
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Amiga.gray,
  },
  selectedLabel: {
    backgroundColor: Amiga.black,
    color: Amiga.white,
  },
});
