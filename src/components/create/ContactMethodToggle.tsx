import Link from 'next/link';
import type { ContactMethod } from '@/types/database';

const OPTIONS: { value: ContactMethod; label: string }[] = [
  { value: 'telegram', label: 'Telegram' },
  { value: 'email', label: 'University Email' },
];

interface ContactMethodToggleProps {
  value: ContactMethod;
  onChange: (value: ContactMethod) => void;
  /** Telegram can be chosen only once the student has linked it in their profile. */
  telegramAvailable: boolean;
}

export function ContactMethodToggle({ value, onChange, telegramAvailable }: ContactMethodToggleProps) {
  return (
    <div className="space-y-2 pt-1">
      <span className="block text-[14px] font-bold text-ink">Preferred Contact Method</span>

      <div role="radiogroup" className="flex items-center gap-1 rounded-[16px] bg-soft p-1">
        {OPTIONS.map((option) => {
          const selected = option.value === value;
          const disabled = option.value === 'telegram' && !telegramAvailable;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={`flex h-[48px] flex-1 cursor-pointer items-center gap-2 rounded-[12px] px-3 transition disabled:cursor-not-allowed disabled:opacity-45 ${
                selected ? 'bg-surface shadow-[0_2px_6px_rgba(0,0,0,0.06)]' : 'bg-transparent'
              }`}
            >
              <div
                className={`flex size-[18px] items-center justify-center rounded-full border ${
                  selected ? 'border-brand-from' : 'border-placeholder'
                }`}
              >
                {selected && <div className="size-2 rounded-full bg-linear-to-r from-brand-from to-brand-to" />}
              </div>
              <span className={`text-[13px] ${selected ? 'font-bold text-ink' : 'font-semibold text-muted'}`}>
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      {!telegramAvailable && (
        <p className="text-[12px] font-semibold text-muted">
          To use Telegram,{' '}
          <Link href="/profile/edit" className="text-brand-from underline-offset-2 hover:underline">
            link it in your profile
          </Link>
          .
        </p>
      )}
    </div>
  );
}
