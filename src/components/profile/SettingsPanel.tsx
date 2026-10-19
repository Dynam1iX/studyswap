import { ChevronRight } from 'lucide-react';
import type { Language } from '@/lib/profile';

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'ru', label: 'RU' },
  { value: 'kz', label: 'KZ' },
];

interface LanguageSwitcherProps {
  value: Language;
  onChange: (language: Language) => void;
}

export function LanguageSwitcher({ value, onChange }: LanguageSwitcherProps) {
  return (
    <div role="radiogroup" aria-label="Interface language" className="flex gap-1 rounded-2xl bg-soft p-[3px]">
      {LANGUAGES.map((lang) => {
        const selected = lang.value === value;
        return (
          <button
            key={lang.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(lang.value)}
            className={`h-11 w-12 cursor-pointer rounded-xl text-xs transition ${
              selected
                ? 'bg-linear-to-r from-brand-from to-brand-to font-extrabold text-white'
                : 'font-bold text-ink hover:bg-line'
            }`}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}

interface SettingsPanelProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
  onOpenNotifications?: () => void;
}

export function SettingsPanel({ language, onLanguageChange, onOpenNotifications }: SettingsPanelProps) {
  return (
    <div className="flex flex-col rounded-3xl border border-line bg-white px-4 py-1.5">
      <div className="flex h-16 items-center justify-between border-b border-line">
        <span className="text-base font-bold text-ink">Language</span>
        <LanguageSwitcher value={language} onChange={onLanguageChange} />
      </div>
      <button
        type="button"
        onClick={onOpenNotifications}
        className="flex h-14 cursor-pointer items-center justify-between text-left"
      >
        <span className="text-base font-bold text-ink">Notifications and privacy</span>
        <ChevronRight aria-hidden className="size-5 text-muted" />
      </button>
    </div>
  );
}
