'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Check, ChevronDown, Globe, Moon, Sun } from 'lucide-react';
import { SoundToggle } from './SoundToggle';
import { applyTheme, currentTheme, type ThemeChoice } from '@/lib/theme';
import { useI18n, type Language } from '@/i18n';

/** Each language is named in itself, so a student finds theirs whatever is on screen. */
const LANGUAGES: { value: Language; label: string; name: string }[] = [
  { value: 'en', label: 'EN', name: 'English' },
  { value: 'ru', label: 'RU', name: 'Русский' },
  { value: 'kz', label: 'KZ', name: 'Қазақша' },
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
      className="relative flex size-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-line-strong bg-surface transition hover:bg-soft active:scale-90 max-[400px]:size-9"
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

/**
 * Language pill with a custom menu: it drops down with a spring, shows each language in
 * its own name, ticks the current one. Click outside or Esc closes it; arrow keys move.
 */
function LanguagePill() {
  const { t, language, setLanguage } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    // Focus the current language, so the arrow keys start from it.
    const frame = requestAnimationFrame(() =>
      optionRefs.current[LANGUAGES.findIndex((item) => item.value === language)]?.focus(),
    );
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
      cancelAnimationFrame(frame);
    };
  }, [open, language]);

  const pick = (value: Language) => {
    setOpen(false);
    buttonRef.current?.focus();
    if (value !== language) setLanguage(value);
  };

  const onMenuKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const current = optionRefs.current.findIndex((node) => node === document.activeElement);
    const step = event.key === 'ArrowDown' ? 1 : -1;
    optionRefs.current[(current + step + LANGUAGES.length) % LANGUAGES.length]?.focus();
  };

  const current = LANGUAGES.find((item) => item.value === language);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`${t.settings.language}: ${current?.name}`}
        className={`flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border bg-surface pr-2.5 pl-3 text-sm max-[400px]:h-9 max-[400px]:pr-2 max-[400px]:pl-2.5 font-bold text-ink transition hover:bg-soft active:scale-95 ${
          open ? 'border-brand-from shadow-[0_0_0_3px_rgba(173,70,255,0.15)]' : 'border-line-strong'
        }`}
      >
        {/* The globe makes room for the logo on 360px phones. */}
        <Globe aria-hidden className="size-4 text-muted max-[400px]:hidden" strokeWidth={2.2} />
        <span key={language} className="animate-pop motion-reduce:animate-none">
          {current?.label}
        </span>
        <ChevronDown
          aria-hidden
          className={`size-3.5 text-muted transition-transform duration-300 ${SPRING} ${open ? 'rotate-180' : ''}`}
          strokeWidth={2.4}
        />
      </button>

      <div
        id={menuId}
        role="menu"
        aria-label={t.settings.language}
        onKeyDown={onMenuKey}
        className={`absolute top-full right-0 z-50 mt-2 flex w-48 origin-top-right flex-col gap-0.5 rounded-2xl border border-line bg-surface p-1.5 shadow-[0_16px_40px_rgba(27,21,48,0.18)] transition-[opacity,transform] duration-300 ${SPRING} ${
          open ? 'visible scale-100 opacity-100' : 'invisible scale-90 opacity-0'
        }`}
      >
        {LANGUAGES.map((item, index) => {
          const selected = item.value === language;
          return (
            <button
              key={item.value}
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              type="button"
              role="menuitemradio"
              aria-checked={selected}
              tabIndex={open ? 0 : -1}
              onClick={() => pick(item.value)}
              style={{ transitionDelay: open ? `${index * 40}ms` : '0ms' }}
              className={`flex h-11 cursor-pointer items-center gap-3 rounded-xl px-2.5 text-left text-sm font-semibold transition-[background-color,transform,opacity] duration-300 outline-none focus-visible:ring-2 focus-visible:ring-brand-from ${
                open ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
              } ${selected ? 'bg-brand-soft text-brand-ink' : 'text-ink hover:bg-soft'}`}
            >
              <span
                className={`flex h-7 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${
                  selected ? 'bg-linear-to-r from-brand-fill-from to-brand-fill-to text-white' : 'bg-soft text-muted'
                }`}
              >
                {item.label}
              </span>
              <span className="flex-1">{item.name}</span>
              {selected && <Check aria-hidden className="size-4 animate-pop text-brand-from motion-reduce:animate-none" strokeWidth={3} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Language, theme and sound for pages without Settings (Login). */
export function QuickSettings() {
  return (
    <div className="flex items-center gap-2 max-[400px]:gap-1.5">
      <LanguagePill />
      <ThemeButton />
      <SoundToggle compact />
    </div>
  );
}
