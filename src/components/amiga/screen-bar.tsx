import { StyleSheet, View } from 'react-native';

import { AmigaText } from '@/components/amiga/amiga-text';
import { DepthGadget } from '@/components/amiga/gadgets';
import { Amiga } from '@/constants/amiga';
import { useAmigaMetrics } from '@/hooks/use-amiga-metrics';
import { useClock } from '@/hooks/use-clock';

const pad = (n: number) => String(n).padStart(2, '0');

/** AmigaDOS style: "Fri 23-Oct-26". */
function formatDate(date: Date) {
  const weekday = date.toLocaleDateString('en', { weekday: 'short' });
  const month = date.toLocaleDateString('en', { month: 'short' });
  return `${weekday} ${pad(date.getDate())}-${month}-${pad(date.getFullYear() % 100)}`;
}

/** The white screen title bar along the top of the Workbench screen. */
export function ScreenBar({ appCount }: { appCount: number }) {
  const now = useClock();
  const { gadget, line, spacing } = useAmigaMetrics();
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  return (
    <View style={[styles.bar, { height: gadget, borderBottomWidth: line }]}>
      <AmigaText numberOfLines={1} style={[styles.title, { paddingHorizontal: spacing.two }]}>
        {`Amiga Workbench   ${appCount} apps   ${time}   ${formatDate(now)}`}
      </AmigaText>
      <DepthGadget />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Amiga.white,
    borderBottomColor: Amiga.black,
  },
  title: {
    flex: 1,
  },
});
