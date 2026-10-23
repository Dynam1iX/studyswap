'use client';

import { paletteFor } from '@/lib/categoryPalette';
import type { Subject } from '@/types/database';
import { useT } from '@/i18n';

interface SubjectSelectProps {
  label: string;
  subjects: Subject[];
  value: number | null;
  onChange: (subjectId: number | null) => void;
  /** Error text to show, or null when the field is valid. */
  error: string | null;
  /** Changes on every failed submit so the field shakes again. */
  shakeKey: number;
  /** Extra space above the field (every field except the first). */
  spaced?: boolean;
}

export function SubjectSelect({ label, subjects, value, onChange, error, shakeKey, spaced = false }: SubjectSelectProps) {
  const t = useT();
  const selected = subjects.find((subject) => subject.id === value);
  const fieldState = error
    ? 'border-danger ring-2 ring-red-100 text-ink'
    : value
      ? 'border-success text-ink'
      : 'border-field text-placeholder';

  return (
    <div key={shakeKey} className={`space-y-1.5 transition ${spaced ? 'pt-1' : ''} ${error ? 'animate-shake' : ''}`}>
      <label className="block text-[14px] font-bold text-ink">
        {label} <span className="text-brand-from">*</span>
      </label>

      <div className="relative">
        <select
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
          className={`h-[44px] w-full cursor-pointer appearance-none rounded-[14px] border bg-surface pr-12 pl-8 text-[16px] font-semibold sm:text-[15px] outline-none transition ${fieldState}`}
        >
          <option value="" disabled>
            {t.create.selectSubject}
          </option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id} className="text-ink">
              {subject.name} ({subject.code})
            </option>
          ))}
        </select>

        <span
          style={{ backgroundColor: paletteFor(selected?.category).dot }}
          className="pointer-events-none absolute top-1/2 left-3 size-2.5 -translate-y-1/2 rounded-full"
        />

        <div className="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1.5">
          {value && !error && (
            <div className="flex size-5 items-center justify-center rounded-full bg-success-soft text-xs font-bold text-success">
              ✓
            </div>
          )}
          <span className="text-xs text-muted">▼</span>
        </div>
      </div>

      {error && <p className="text-[12px] font-semibold text-danger">{error}</p>}
      {!error && value && <p className="text-[13px] font-semibold text-success">{t.create.subjectSelected}</p>}
    </div>
  );
}
