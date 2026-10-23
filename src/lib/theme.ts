export type ThemeChoice = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'studyswap-theme';

/** Browser bar colour per theme (the page background). */
export const THEME_COLORS: Record<ThemeChoice, string> = { light: '#fbf9ff', dark: '#120e1f' };

/**
 * Runs in <head> before the first paint, so a dark-theme student never sees a white flash.
 * The light theme is the default; only a saved "dark" switches it.
 */
export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem('${THEME_STORAGE_KEY}')==='dark'){document.documentElement.classList.add('dark');var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content','${THEME_COLORS.dark}')}}catch(e){}`;

export function currentTheme(): ThemeChoice {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function setThemeClass(theme: ThemeChoice) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
}

/**
 * Switches the theme and saves it. With View Transitions the new theme spreads
 * in a circle from `origin` (the switch); otherwise the colours cross-fade.
 */
export function applyTheme(theme: ThemeChoice, origin?: HTMLElement | null) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Not saved (private mode); the theme still changes for this visit.
  }

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    setThemeClass(theme);
    return;
  }

  if (typeof document.startViewTransition !== 'function') {
    root.classList.add('theme-fade');
    setThemeClass(theme);
    window.setTimeout(() => root.classList.remove('theme-fade'), 450);
    return;
  }

  if (origin) {
    const rect = origin.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    root.style.setProperty('--theme-x', `${x}px`);
    root.style.setProperty('--theme-y', `${y}px`);
    root.style.setProperty('--theme-r', `${radius}px`);
  }
  document.startViewTransition(() => setThemeClass(theme));
}
