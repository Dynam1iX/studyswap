'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { ChevronDown, Globe, Moon, Sun } from 'lucide-react';
import { SoundToggle } from './SoundToggle';
import { applyTheme, currentTheme, type ThemeChoice } from '@/lib/theme';
import { useI18n, type Language } from '@/i18n';

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'ru', label: 'RU' },
  { value: 'kz', label: 'KZ' },
];

const SPRING = 'ease-[cubic-bezier(0.34,1.56,0.64,1)]';

/** Sun / moon button: the icons roll past each other and the new theme spreads in a circle from it. */
function ThemeButton() {
  const { t } = useI18n();
  const [theme, setTheme] = useState<ThemeChoice>('light');
  const night = theme === 'dark';

  useEffect(() => {
    const frame = requestAnimationFrame(() => setTheme(currentTheme()));
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    const next: ThemeChoice = night ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next, event.currentTarget);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={night}
      aria-label={t.settings.darkTheme}
      title={t.settings.darkTheme}
      className="relative flex size-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-line-strong bg-surface transition hover:bg-soft active:scale-90"
    >
      <Sun
        aria-hidden
        strokeWidth={2.2}
        className={`absolute size-[18px] text-[#F59E0B] transition-[transform,opacity] duration-500 ${SPRING} ${
          night ? 'translate-y-6 rotate-90 opacity-0' : 'translate-y-0 rotate-0 opacity-100'
        }`}
      />
      <Moon
        aria-hidden
        strokeWidth={2.2}
        className={`absolute size-[18px] text-brand-from transition-[transform,opacity] duration-500 ${SPRING} ${
          night ? 'translate-y-0 rotate-0 opacity-100' : '-translate-y-6 -rotate-90 opacity-0'
        }`}
      />
    </button>
  );
}

/** Language pill: a native select (keyboard and screen-reader friendly) dressed as a button. */
function LanguagePill() {
  const { t, language, setLanguage } = useI18n();
  return (
    <label className="relative flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-line-strong bg-surface pr-2.5 pl-3 text-sm font-bold text-ink transition hover:bg-soft">
      {/* The globe makes room for the logo on 360px phones. */}
      <Globe aria-hidden className="size-4 text-muted max-[400px]:hidden" strokeWidth={2.2} />
      <span aria-hidden>{LANGUAGES.find((item) => item.value === language)?.label}</span>
      <ChevronDown aria-hidden className="size-3.5 text-muted" strokeWidth={2.4} />
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
        aria-label={t.settings.language}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {LANGUAGES.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Language, theme and sound for pages without Settings (Login). */
export function QuickSettings() {
  return (
    <div className="flex items-center gap-2">
      <LanguagePill />
      <ThemeButton />
      <SoundToggle compact />
    </div>
  );
}
