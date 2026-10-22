import { ChevronRight, ShieldCheck } from 'lucide-react';
import type { Language } from '@/lib/profile';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';

interface SettingsPanelProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
  onOpenPrivacy?: () => void;
}

export function SettingsPanel({ language, onLanguageChange, onOpenPrivacy }: SettingsPanelProps) {
  return (
    <div className="flex flex-col rounded-3xl border border-line bg-white px-4 py-1.5">
      <div className="flex h-16 items-center justify-between border-b border-line">
        <span className="text-base font-bold text-ink">Language</span>
        <LanguageSwitcher value={language} onChange={onLanguageChange} />
      </div>
      <div className="flex h-16 items-center justify-between border-b border-line">
        <span className="text-base font-bold text-ink">Dark theme</span>
        <ThemeToggle />
      </div>
      <button
        type="button"
        onClick={onOpenPrivacy}
        aria-haspopup="dialog"
        className="group flex h-14 cursor-pointer items-center justify-between text-left"
      >
        <span className="flex items-center gap-2.5 text-base font-bold text-ink">
          <ShieldCheck aria-hidden className="size-5 text-brand-from" strokeWidth={2.2} />
          Privacy and security
        </span>
        <ChevronRight aria-hidden className="size-5 text-muted transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}
