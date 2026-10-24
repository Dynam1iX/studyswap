'use client';

import { useSyncExternalStore } from 'react';

/** The `lg` breakpoint from globals.css (Bootstrap LG, 992px). */
const DESKTOP_QUERY = '(min-width: 62rem)';

function subscribe(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/** True on desktop-sized windows (≥992px); follows window resizes. */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}
