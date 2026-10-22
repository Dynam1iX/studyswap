'use client';

import { useEffect, useState } from 'react';

export type ThemeChoice = 'light' | 'dark';

const STORAGE_KEY = 'studyswap-theme';

/** Stars that light up on the night sky, left side of the track. */
const STARS = [
  { left: 9, top: 8, size: 3, delay: 120 },
  { left: 18, top: 19, size: 2, delay: 220 },
  { left: 27, top: 9, size: 2, delay: 300 },
  { left: 13, top: 25, size: 1.5, delay: 380 },
];

function readTheme(): ThemeChoice {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/**
 * Day / night switch: the sun rolls across a sky that turns from day to night,
 * a shadow slides over it until only a crescent moon is left, and stars come out.
 * For now it only remembers the choice; the dark theme itself comes later.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeChoice>('light');
  const night = theme === 'dark';

  useEffect(() => {
    const frame = requestAnimationFrame(() => setTheme(readTheme()));
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggle = () => {
    const next: ThemeChoice = night ? 'light' : 'dark';
    setTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not saved (private mode); the switch still works for this visit.
    }
  };

  const ease = 'ease-[cubic-bezier(0.68,-0.3,0.32,1.3)]';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={night}
      aria-label="Dark theme"
      onClick={toggle}
      className="relative h-9 w-[68px] shrink-0 cursor-pointer overflow-hidden rounded-full shadow-[inset_0_1px_4px_rgba(27,21,48,0.18)] transition-transform active:scale-95"
    >
      {/* Sky: day and night layers cross-fade */}
      <span aria-hidden className="absolute inset-0 bg-linear-to-br from-[#BEE3FF] via-[#D9EEFF] to-[#FFE9C2]" />
      <span
        aria-hidden
        className={`absolute inset-0 bg-linear-to-br from-[#2B2160] via-[#1F1A45] to-[#3A1F5C] transition-opacity duration-500 ${
          night ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Clouds drift away at night */}
      <span
        aria-hidden
        className={`absolute top-[17px] right-[7px] h-[9px] w-[22px] rounded-full bg-white/90 transition-all duration-500 ${
          night ? 'translate-x-4 opacity-0' : 'translate-x-0 opacity-100'
        }`}
      >
        <span className="absolute -top-[5px] left-[5px] size-[10px] rounded-full bg-white/90" />
      </span>

      {/* Stars twinkle in one by one */}
      {STARS.map((star) => (
        <span
          key={`${star.left}-${star.top}`}
          aria-hidden
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            transitionDelay: night ? `${star.delay}ms` : '0ms',
          }}
          className={`absolute rounded-full bg-white transition-all duration-300 ${
            night ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          }`}
        />
      ))}

      {/* Sun → moon */}
      <span
        aria-hidden
        className={`absolute top-1 left-1 size-7 transition-transform duration-500 ${ease} ${
          night ? 'translate-x-8 -rotate-180' : 'translate-x-0 rotate-0'
        }`}
      >
        {/* Glow */}
        <span
          className={`absolute -inset-1 rounded-full blur-[3px] transition-colors duration-500 ${
            night ? 'bg-[#F5F3FF]/25' : 'bg-[#FFC53D]/50'
          }`}
        />
        <span
          className={`absolute inset-0 overflow-hidden rounded-full transition-colors duration-500 ${
            night ? 'bg-[#F5F3FF]' : 'bg-[#FFC53D]'
          }`}
        >
          {/* The shadow that turns the full disc into a crescent */}
          <span
            className={`absolute top-0 left-0 size-7 rounded-full bg-[#251D52] transition-transform duration-500 ${ease} ${
              night ? 'translate-x-[8px] -translate-y-[5px]' : 'translate-x-[30px] -translate-y-[24px]'
            }`}
          />
          {/* Craters fade in on the moon */}
          <span
            className={`absolute top-[18px] left-[4px] size-[3px] rounded-full bg-[#DCD6F0] transition-opacity delay-200 duration-300 ${
              night ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <span
            className={`absolute top-[12px] left-[3px] size-[2px] rounded-full bg-[#DCD6F0] transition-opacity delay-300 duration-300 ${
              night ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </span>
      </span>
    </button>
  );
}
