import { StyleSheet, View } from 'react-native';

import { AmigaText } from '@/components/amiga/amiga-text';
import { DepthGadget } from '@/components/amiga/gadgets';
import { Amiga } from '@/constants/amiga';
import { useAmigaMetrics } from '@/hooks/use-amiga-metrics';
import { useClock } from '@/hooks/use-clock';
import { useSystemStats } from '@/hooks/use-system-stats';

const pad = (n: number) => String(n).padStart(2, '0');

/** AmigaDOS style: "Fri 23-Oct-26". */
function formatDate(date: Date) {
  const weekday = date.toLocaleDateString('en', { weekday: 'short' });
  const month = date.toLocaleDateString('en', { month: 'short' });
  return `${weekday} ${pad(date.getDate())}-${month}-${pad(date.getFullYear() % 100)}`;
}

/** "358 MB" below 1 GB, "1.4 GB" above. */
function formatBytes(bytes: number) {
  const mb = bytes / 1024 ** 2;
  return mb < 1024 ? `${Math.round(mb)} MB` : `${(mb / 1024).toFixed(1)} GB`;
}

/** The white screen title bar along the top of the Workbench screen. */
export function ScreenBar({ appCount }: { appCount: number }) {
  const now = useClock();
  const { gadget, line, spacing } = useAmigaMetrics();
  const { freeMemory, freeDisk } = useSystemStats();
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const parts = [
    'Amiga Workbench',
    `${appCount} apps`,
    freeMemory != null && `${formatBytes(freeMemory)} free mem`,
    freeDisk != null && `${formatBytes(freeDisk)} free disk`,
    time,
    formatDate(now),
  ].filter(Boolean);

  return (
    <View style={[styles.bar, { height: gadget, borderBottomWidth: line }]}>
      <AmigaText numberOfLines={1} style={[styles.title, { paddingHorizontal: spacing.two }]}>
        {parts.join('   ')}
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
