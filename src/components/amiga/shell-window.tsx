import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AmigaText } from '@/components/amiga/amiga-text';
import { AmigaWindow, type ScrollPosition } from '@/components/amiga/window';
import { Amiga } from '@/constants/amiga';
import { useAmigaMetrics } from '@/hooks/use-amiga-metrics';
import { useShellLines } from '@/hooks/use-shell-lines';

const PROMPT = '1.Workbench2.0:> ';
const CURSOR_BLINK_MS = 530;

/**
 * An AmigaShell window showing text published to the shell channel. It
 * always follows the newest line and can't take focus, so the remote stays
 * on the desktop icons.
 */
export function ShellWindow() {
  const lines = useShellLines();
  const { spacing, fontSize } = useAmigaMetrics();
  const [heights, setHeights] = useState({ visible: 0, content: 0 });
  const cursorVisible = useBlink(CURSOR_BLINK_MS);

  // Pinned to the bottom, so the knob always sits at the end.
  const size =
    heights.content > 0 ? Math.min(1, heights.visible / heights.content) : 1;
  const scroll: ScrollPosition = { start: 1 - size, size };

  return (
    <AmigaWindow title="AmigaShell" scroll={scroll}>
      <View
        style={styles.viewport}
        onLayout={(e) => {
          const visible = e.nativeEvent.layout.height;
          setHeights((h) => ({ ...h, visible }));
        }}
      >
        <View
          style={{ padding: spacing.one }}
          onLayout={(e) => {
            const content = e.nativeEvent.layout.height;
            setHeights((h) => ({ ...h, content }));
          }}
        >
          {lines.map((line) => (
            <AmigaText key={line.id}>{line.text || ' '}</AmigaText>
          ))}
          <View style={styles.prompt}>
            <AmigaText>{PROMPT}</AmigaText>
            <View
              style={{
                width: fontSize * 0.6,
                height: fontSize * 1.1,
                backgroundColor: cursorVisible ? Amiga.blue : 'transparent',
              }}
            />
          </View>
        </View>
      </View>
    </AmigaWindow>
  );
}

/** Toggles between true and false every `ms` milliseconds. */
function useBlink(ms: number) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setOn((v) => !v), ms);
    return () => clearInterval(id);
  }, [ms]);
  return on;
}

const styles = StyleSheet.create({
  // Lines stack up from the bottom; older ones are clipped off the top.
  viewport: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  prompt: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
