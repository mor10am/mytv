import { useEffect, useRef } from 'react';

import { publish } from '@/lib/shell-channel';

type Options = { appCount: number; loading: boolean; supported: boolean };

/** Prints the boot status to the shell once, as the app list comes in. */
export function useBootMessages({ appCount, loading, supported }: Options) {
  const started = useRef(false);
  const finished = useRef(false);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      publish('Kickstart 37.175, Workbench 40.42');
      publish(`Loading launcher module... ${supported ? 'ok' : 'not available'}`);
    }
    if (finished.current || loading) return;
    finished.current = true;
    publish(supported ? `Found ${appCount} apps` : 'App list not available');
    publish('mytv ready. Pick an app with the remote.');
  }, [appCount, loading, supported]);
}
