'use client';

import { useId, useState, type RefObject } from 'react';
import { Check, X } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { PROGRAM_GROUPS, STUDY_YEARS } from '@/lib/search';
import type { StudyYear } from '@/types/database';
import type { FilterKind } from './FilterBar';
import { useT } from '@/i18n';

interface FilterSheetProps {
  /** Which filter to pick, or null when the sheet is closed. */
  kind: FilterKind | null;
  year: StudyYear | null;
  program: string | null;
  onYearChange: (year: StudyYear | null) => void;
  onProgramChange: (program: string | null) => void;
  onClose: () => void;
  /** The chip that opened it: on desktop the options drop down from there. */
  anchor?: RefObject<HTMLElement | null>;
}

function Option({
  label,
  selected,
  index,
  onSelect,
}: {
  label: string;
  selected: boolean;
  index: number;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      style={{ animationDelay: `${60 + index * 30}ms` }}
      className={`flex min-h-12 w-full animate-rise lg:min-h-10 lg:py-2 lg:text-sm cursor-pointer items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-semibold transition-[background-color,color,transform] duration-200 active:scale-[0.98] motion-reduce:animate-none ${
        selected ? 'bg-soft text-ink' : 'text-ink hover:bg-soft/70'
      }`}
    >
      <span>{label}</span>
      <span
        aria-hidden
        className={`flex size-6 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
          selected
            ? 'scale-100 bg-linear-to-r from-brand-from to-brand-to text-white'
            : 'scale-90 border-2 border-line-strong text-transparent'
        }`}
      >
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    </button>
  );
}

/** Bottom sheet with the options of one filter. Picking an option applies it and closes the sheet. */
export function FilterSheet({ kind, year, program, onYearChange, onProgramChange, onClose, anchor }: FilterSheetProps) {
  const t = useT();
  const titleId = useId();
  // Keep the last filter on screen while the sheet animates out.
  const [lastKind, setLastKind] = useState(kind);
  if (kind && kind !== lastKind) setLastKind(kind);
  const shown = kind ?? lastKind;

  const pickYear = (value: StudyYear | null) => {
    onYearChange(value);
    onClose();
  };
  const pickProgram = (value: string | null) => {
    onProgramChange(value);
    onClose();
  };

  let index = 0;

  return (
    <BottomSheet
      open={kind !== null}
      onClose={onClose}
      labelledBy={titleId}
      anchor={anchor}
      header={
        <div className="flex items-center justify-between px-6 py-2 lg:px-4 lg:py-0">
          <h2 id={titleId} className="font-bricolage text-[22px] font-extrabold text-ink lg:text-base">
            {shown === 'year' ? t.search.yearTitle : shown === 'faculty' ? t.search.facultyFilter : ''}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-soft text-ink transition hover:bg-line focus-visible:outline-2 focus-visible:outline-brand-from lg:size-8"
          >
            <X className="size-5" strokeWidth={2.4} />
          </button>
        </div>
      }
    >
      {/* key: replay the option animation each time a sheet opens */}
      <div key={`${shown}-${kind !== null}`} role="radiogroup" aria-labelledby={titleId} className="flex flex-col gap-1 px-4 pt-2 pb-10 lg:px-2 lg:pb-2">
        {shown === 'year' && (
          <>
            <Option label={t.search.anyYear} selected={year === null} index={index++} onSelect={() => pickYear(null)} />
            {STUDY_YEARS.map((value) => (
              <Option
                key={value}
                label={t.common.year(value)}
                selected={year === value}
                index={index++}
                onSelect={() => pickYear(value)}
              />
            ))}
          </>
        )}

        {shown === 'faculty' && (
          <>
            <Option label={t.search.allPrograms} selected={program === null} index={index++} onSelect={() => pickProgram(null)} />
            {PROGRAM_GROUPS.map((group, groupIndex) => (
              <div key={groupIndex} className="flex flex-col gap-1 border-t border-line pt-1">
                {group.map((option) => (
                  <Option
                    key={option.label}
                    label={option.label}
                    selected={program === option.label}
                    index={index++}
                    onSelect={() => pickProgram(option.label)}
                  />
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </BottomSheet>
  );
}
