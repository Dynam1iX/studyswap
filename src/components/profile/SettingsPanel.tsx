import { ChevronRight } from 'lucide-react';
import type { Language } from '@/lib/profile';
import { LanguageSwitcher } from './LanguageSwitcher';

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
