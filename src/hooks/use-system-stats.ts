import { useEffect, useState } from 'react';

import Launcher, { type CpuSample } from '@/modules/launcher';

const POLL_MS = 5_000;

export type SystemStats = {
  /** Free RAM in bytes. */
  freeMemory: number | null;
  /** Free internal storage in bytes. */
  freeDisk: number | null;
  /** CPU usage over the last poll interval, 0–100. */
  cpuPercent: number | null;
  /** Whether `cpuPercent` covers the whole device or only this app. */
  cpuScope: CpuSample['scope'] | null;
};

/** Busy share of all cores between two samples, or null if they can't be compared. */
function cpuPercentBetween(prev: CpuSample, next: CpuSample): number | null {
  if (prev.scope !== next.scope) return null;
  const total = next.total - prev.total;
  if (total <= 0) return null;
  const busy = 1 - (next.idle - prev.idle) / total;
  return Math.min(100, Math.max(0, Math.round(busy * 100)));
}

/** Free memory, free disk and CPU usage, polled from Android. Values are null until known or when unsupported. */
export function useSystemStats(): SystemStats {
  const [stats, setStats] = useState<SystemStats>({
    freeMemory: null,
    freeDisk: null,
    cpuPercent: null,
    cpuScope: null,
  });

  useEffect(() => {
    const launcher = Launcher;
    if (!launcher) return;
    let active = true;
    let lastCpu: CpuSample | null = null;
    const poll = async () => {
      const [memory, storage, cpu] = await Promise.allSettled([
        launcher.getMemoryInfo(),
        launcher.getStorageInfo(),
        launcher.getCpuSample(),
      ]);
      if (!active) return;
      let cpuPercent: number | null = null;
      if (cpu.status === 'fulfilled') {
        if (lastCpu) cpuPercent = cpuPercentBetween(lastCpu, cpu.value);
        lastCpu = cpu.value;
      }
      // Keep the last known value for whichever call failed.
      setStats((prev) => ({
        freeMemory: memory.status === 'fulfilled' ? memory.value.availMem : prev.freeMemory,
        freeDisk: storage.status === 'fulfilled' ? storage.value.availBytes : prev.freeDisk,
        cpuPercent: cpuPercent ?? prev.cpuPercent,
        cpuScope: cpuPercent != null && lastCpu ? lastCpu.scope : prev.cpuScope,
      }));
    };
    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return stats;
}
