'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { en, type Messages } from './en';
import { kz } from './kz';
import { ru } from './ru';

export type Language = 'en' | 'ru' | 'kz';
export type { Messages };

export const LANGUAGE_STORAGE_KEY = 'studyswap-language';

const MESSAGES: Record<Language, Messages> = { en, ru, kz };

/** Locale for dates and numbers, and the <html lang> value. */
export const LOCALES: Record<Language, string> = { en: 'en-GB', ru: 'ru-RU', kz: 'kk-KZ' };
const HTML_LANG: Record<Language, string> = { en: 'en', ru: 'ru', kz: 'kk' };

/** The saved choice, or the phone's language (Russian, Kazakh, otherwise English). */
function detectLanguage(): Language {
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'en' || saved === 'ru' || saved === 'kz') return saved;
  } catch {
    // No storage (private mode): fall back to the phone's language.
  }
  for (const tag of navigator.languages?.length ? navigator.languages : [navigator.language]) {
    const code = tag.toLowerCase();
    if (code.startsWith('kk')) return 'kz';
    if (code.startsWith('ru')) return 'ru';
    if (code.startsWith('en')) return 'en';
  }
  return 'en';
}

/**
 * Messages in the current language for code outside React components (error texts in lib/).
 * Kept in sync by the provider.
 */
let current: Messages = en;
/** Timer of the running language-switch animation. */
let switchTimer = 0;
export function messages(): Messages {
  return current;
}

interface I18nValue {
  language: Language;
  t: Messages;
  locale: string;
  setLanguage: (language: Language) => void;
}

const I18nContext = createContext<I18nValue>({ language: 'en', t: en, locale: LOCALES.en, setLanguage: () => {} });

export function I18nProvider({ children }: { children: ReactNode }) {
  // The pages render only in the browser (behind the AuthGate splash), so reading here is safe.
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    const detected = detectLanguage();
    // Ready before the first render, so texts made outside components are translated too.
    current = MESSAGES[detected];
    return detected;
  });
  useEffect(() => {
    current = MESSAGES[language];
    document.documentElement.lang = HTML_LANG[language];
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {
      // Not saved; the language still changes for this visit.
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setLanguageState(next);
      return;
    }
    // The page blurs out, the texts change, then the blocks rise back in (styles in globals.css).
    const root = document.documentElement;
    window.clearTimeout(switchTimer);
    root.classList.remove('lang-in');
    root.classList.add('lang-out');
    switchTimer = window.setTimeout(() => {
      flushSync(() => setLanguageState(next));
      root.classList.remove('lang-out');
      root.classList.add('lang-in');
      switchTimer = window.setTimeout(() => root.classList.remove('lang-in'), 900);
    }, 180);
  }, []);

  const value = useMemo(
    () => ({ language, t: MESSAGES[language], locale: LOCALES[language], setLanguage }),
    [language, setLanguage],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Current language, its messages and the switch. */
export function useI18n(): I18nValue {
  return useContext(I18nContext);
}

/** Just the messages. */
export function useT(): Messages {
  return useContext(I18nContext).t;
}
