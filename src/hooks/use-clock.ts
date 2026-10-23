import { useEffect, useState } from 'react';

/** Current time, updated at the start of every minute. */
export function useClock(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const date = new Date();
      setNow(date);
      timer = setTimeout(tick, 60_000 - (date.getSeconds() * 1000 + date.getMilliseconds()));
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  return now;
}
