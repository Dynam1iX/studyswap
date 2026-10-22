'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Plays a one-shot CSS animation class again on every call, like the classic
 * "remove the class, add it back, remove it after 700ms" bubbly-button script.
 * Returns [active, play].
 */
export function useReplay(durationMs = 700): [boolean, () => void] {
  const [active, setActive] = useState(false);
  const frame = useRef(0);
  const timer = useRef(0);

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      window.clearTimeout(timer.current);
    },
    [],
  );

  const play = useCallback(() => {
    cancelAnimationFrame(frame.current);
    window.clearTimeout(timer.current);
    // Reset first so a second tap restarts the animation from the beginning.
    setActive(false);
    // Two frames so the "off" state is painted before the class comes back.
    frame.current = requestAnimationFrame(() => {
      frame.current = requestAnimationFrame(() => {
        setActive(true);
        timer.current = window.setTimeout(() => setActive(false), durationMs);
      });
    });
  }, [durationMs]);

  return [active, play];
}
