import { useEffect, useState } from 'react';

import Launcher from '@/modules/launcher';

const POLL_MS = 5_000;

export type SystemStats = {
  /** Free RAM in bytes. */
  freeMemory: number | null;
  /** Free internal storage in bytes. */
  freeDisk: number | null;
};

/** Free memory and disk space, polled from Android. Values are null until known or when unsupported. */
export function useSystemStats(): SystemStats {
  const [stats, setStats] = useState<SystemStats>({ freeMemory: null, freeDisk: null });

  useEffect(() => {
    const launcher = Launcher;
    if (!launcher) return;
    let active = true;
    const poll = async () => {
      const [memory, storage] = await Promise.allSettled([
        launcher.getMemoryInfo(),
        launcher.getStorageInfo(),
      ]);
      if (!active) return;
      // Keep the last known value for whichever call failed.
      setStats((prev) => ({
        freeMemory: memory.status === 'fulfilled' ? memory.value.availMem : prev.freeMemory,
        freeDisk: storage.status === 'fulfilled' ? storage.value.availBytes : prev.freeDisk,
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
