import { useSyncExternalStore } from 'react';

import { getLines, subscribe } from '@/lib/shell-channel';

/** Lines published to the shell channel, updated as new ones arrive. */
export function useShellLines() {
  return useSyncExternalStore(subscribe, getLines);
}
