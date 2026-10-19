import type { ContactMethod } from '@/types/database';

const OPTIONS: { value: ContactMethod; label: string }[] = [
  { value: 'telegram', label: 'Telegram' },
  { value: 'email', label: 'University Email' },
];

interface ContactMethodToggleProps {
  value: ContactMethod;
  onChange: (value: ContactMethod) => void;
}

export function ContactMethodToggle({ value, onChange }: ContactMethodToggleProps) {
  return (
    <div className="space-y-2 pt-1">
      <span className="block text-[14px] font-bold text-ink">Preferred Contact Method</span>

      <div role="radiogroup" className="flex items-center gap-1 rounded-[16px] bg-soft p-1">
        {OPTIONS.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={`flex h-[48px] flex-1 cursor-pointer items-center gap-2 rounded-[12px] px-3 transition ${
                selected ? 'bg-white shadow-[0_2px_6px_rgba(0,0,0,0.06)]' : 'bg-transparent'
              }`}
            >
              <div
                className={`flex size-[18px] items-center justify-center rounded-full border ${
                  selected ? 'border-brand-from' : 'border-[#8F88A8]'
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
    </div>
  );
}
