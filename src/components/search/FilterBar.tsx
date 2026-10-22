import { ChevronDown } from 'lucide-react';
import type { StudyYear } from '@/types/database';

export type FilterKind = 'year' | 'faculty';

interface FilterBarProps {
  year: StudyYear | null;
  program: string | null;
  /** The filter whose sheet is open, so its chevron points up. */
  openFilter: FilterKind | null;
  onOpen: (kind: FilterKind) => void;
}

const CHIP =
  'relative flex h-11 shrink-0 cursor-pointer items-center gap-1.5 overflow-hidden rounded-3xl border px-3.5 text-sm font-semibold transition-[transform,border-color,color,box-shadow] duration-300 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-from';

function FilterChip({
  label,
  value,
  open,
  onClick,
}: {
  label: string;
  value: string | null;
  open: boolean;
  onClick: () => void;
}) {
  const active = value !== null;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={open}
      className={`${CHIP} ${
        active
          ? 'border-transparent text-white shadow-[0_6px_16px_rgba(173,70,255,0.3)]'
          : 'border-line-strong bg-white text-ink hover:border-field'
      }`}
    >
      {/* Gradient fill that fades in when a value is chosen */}
      <span
        aria-hidden
        className={`absolute inset-0 bg-linear-to-r from-brand-from to-brand-to transition-opacity duration-300 ${
          active ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <span className="relative max-w-[180px] truncate">{active ? value : label}</span>
      <ChevronDown
        aria-hidden
        className={`relative size-4 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''} ${
          active ? 'text-white' : 'text-muted'
        }`}
        strokeWidth={2.2}
      />
    </button>
  );
}

/** Year / Faculty / Language chips; scrolls sideways on narrow screens. */
export function FilterBar({ year, program, openFilter, onOpen }: FilterBarProps) {
  return (
    <div className="no-scrollbar -mx-4 -my-3 flex items-center gap-2 overflow-x-auto px-4 py-3">
      <FilterChip
        label="Year"
        value={year ? `Year ${year}` : null}
        open={openFilter === 'year'}
        onClick={() => onOpen('year')}
      />
      <FilterChip
        label="Faculty"
        value={program}
        open={openFilter === 'faculty'}
        onClick={() => onOpen('faculty')}
      />
      {/* Language filter arrives later; shown dimmed like unfinished tabs in the nav. */}
      <button
        type="button"
        disabled
        title="Coming soon"
        className={`${CHIP} cursor-not-allowed border-line-strong bg-white text-ink opacity-50`}
      >
        Language
        <ChevronDown aria-hidden className="size-4 text-muted" strokeWidth={2.2} />
      </button>
    </div>
  );
}
