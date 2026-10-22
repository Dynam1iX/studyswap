'use client';

import { useEffect, useState } from 'react';

interface CountUpProps {
  value: number;
  /** Animation length in ms. */
  duration?: number;
}

/** A number that counts up from 0 to its value (instantly with reduced motion). */
export function CountUp({ value, duration = 900 }: CountUpProps) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || value <= 0) {
      const frame = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(frame);
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(eased * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return (
    <span aria-label={String(value)} className="tabular-nums">
      {shown}
    </span>
  );
}
