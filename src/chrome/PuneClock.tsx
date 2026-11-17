import { useEffect, useState } from 'react';
import { cn } from '../lib/cn';

const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const now = () => fmt.format(new Date());

/** Live Pune clock, "PUNE 14:32:07 IST". Ticks on the second boundary. */
export function PuneClock({ className }: { className?: string }) {
  const [time, setTime] = useState(now);

  useEffect(() => {
    let id = 0;
    const schedule = () => {
      id = window.setTimeout(() => {
        setTime(now());
        schedule();
      }, 1000 - (Date.now() % 1000) + 12);
    };
    schedule();
    return () => window.clearTimeout(id);
  }, []);

  return (
    <span className={cn('whitespace-nowrap tabular-nums', className)}>
      <span className="sr-only">Local time in </span>Pune <time>{time}</time> IST
    </span>
  );
}
