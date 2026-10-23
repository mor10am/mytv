import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AmigaText } from '@/components/amiga/amiga-text';
import { Bevel } from '@/components/amiga/bevel';
import {
  ArrowGadget,
  CloseGadget,
  DepthGadget,
  SizeGadget,
  ZoomGadget,
} from '@/components/amiga/gadgets';
import { Amiga } from '@/constants/amiga';
import { useAmigaMetrics } from '@/hooks/use-amiga-metrics';

/** Visible part of the content, as fractions of its total height. */
export type ScrollPosition = { start: number; size: number };

type Props = {
  title: string;
  /** Drives the vertical scrollbar knob. */
  scroll?: ScrollPosition;
  children: ReactNode;
};

/** An active Workbench 2.0 window: blue title bar, gadgets and scrollbars. */
export function AmigaWindow({ title, scroll = { start: 0, size: 1 }, children }: Props) {
  const { gadget, line, spacing } = useAmigaMetrics();

  return (
    <Bevel style={styles.window}>
      <View style={[styles.row, { height: gadget }]}>
        <CloseGadget />
        <Bevel style={[styles.fill, { paddingHorizontal: spacing.two, justifyContent: 'center' }]}>
          <AmigaText numberOfLines={1}>{title}</AmigaText>
        </Bevel>
        <ZoomGadget />
        <DepthGadget />
      </View>

      <View style={[styles.fill, styles.row]}>
        <View style={[styles.fill, styles.content]}>{children}</View>

        <View style={{ width: gadget }}>
          <Bevel style={[styles.fill, { padding: line }]}>
            <Bevel
              style={[
                styles.knob,
                { top: `${scroll.start * 100}%`, height: `${scroll.size * 100}%`, margin: line },
              ]}
            />
          </Bevel>
          <ArrowGadget direction="up" />
          <ArrowGadget direction="down" />
        </View>
      </View>

      <View style={[styles.row, { height: gadget }]}>
        <Bevel style={[styles.fill, { padding: line }]}>
          <Bevel style={[styles.fill, styles.knobFill]} />
        </Bevel>
        <ArrowGadget direction="back" />
        <ArrowGadget direction="forward" />
        <SizeGadget />
      </View>
    </Bevel>
  );
}

const styles = StyleSheet.create({
  window: {
    flex: 1,
    backgroundColor: Amiga.blue,
  },
  row: {
    flexDirection: 'row',
  },
  fill: {
    flex: 1,
  },
  content: {
    backgroundColor: Amiga.gray,
  },
  knob: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: Amiga.gray,
  },
  knobFill: {
    backgroundColor: Amiga.gray,
  },
});
