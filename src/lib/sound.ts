'use client';

import { useSyncExternalStore } from 'react';

/**
 * Interface sounds. Every sound answers something the student just did (never plays by
 * itself) and always has a visual twin on screen: the like burst, the "Published!" check,
 * the Telegram burst and toast, the shake and red text of an error.
 *
 * Files: /public/sounds/*.mp3 (own work, synthesised with ffmpeg; masters in /media/sounds).
 */
export type SoundName = 'like' | 'publish' | 'linked' | 'error';

const STORAGE_KEY = 'studyswap-sound';
const VOLUME: Record<SoundName, number> = { like: 0.55, publish: 0.6, linked: 0.6, error: 0.45 };

const listeners = new Set<() => void>();
const cache: Partial<Record<SoundName, HTMLAudioElement>> = {};

/** Sounds are on unless the student turned them off. */
export function soundEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setSoundEnabled(on: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    // Not saved (private mode); nothing else to do.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Whether sounds are on; re-renders when any switch changes it. */
export function useSoundEnabled(): boolean {
  return useSyncExternalStore(subscribe, soundEnabled, () => true);
}

/** Plays a short interface sound, if sounds are on. Silent when the browser refuses. */
export function playSound(name: SoundName) {
  if (typeof window === 'undefined' || !soundEnabled()) return;
  let audio = cache[name];
  if (!audio) {
    audio = new Audio(`/sounds/${name}.mp3`);
    audio.preload = 'auto';
    cache[name] = audio;
  }
  audio.volume = VOLUME[name];
  audio.currentTime = 0;
  void audio.play().catch(() => {});
}
