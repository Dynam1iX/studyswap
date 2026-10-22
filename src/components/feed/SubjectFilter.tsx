'use client';

import { useRef, useState, type MouseEvent } from 'react';
import { paletteFor } from '@/lib/categoryPalette';
import type { Subject } from '@/types/database';

export type SubjectFilterValue = number | 'All';

interface SubjectFilterProps {
  subjects: Subject[];
  value: SubjectFilterValue;
  onChange: (value: SubjectFilterValue) => void;
}

const THUMB_WIDTH = 48;

function chipClasses(active: boolean) {
  return `relative flex shrink-0 cursor-pointer items-center gap-1.5 overflow-hidden rounded-[25px] border px-4 py-[9px] text-[14px] leading-[17px] font-bold shadow-sm outline-none transition-[color,border-color,box-shadow,transform] duration-300 active:scale-95 ${
    active
      ? 'border-transparent text-white shadow-[0_6px_16px_rgba(173,70,255,0.3)]'
      : 'border-line-strong bg-white text-ink'
  }`;
}

/** Gradient fill that fades in on the selected chip. */
function ChipFill({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={`absolute inset-0 bg-linear-to-r from-brand-from to-brand-to transition-opacity duration-300 ${
        active ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
}

/** Horizontally scrolling subject chips with a gradient slider underneath. */
export function SubjectFilter({ subjects, value, onChange }: SubjectFilterProps) {
  const chipsRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const handleScroll = () => {
    const chips = chipsRef.current;
    if (!chips) return;
    const maxScroll = chips.scrollWidth - chips.clientWidth;
    if (maxScroll > 0) setProgress(chips.scrollLeft / maxScroll);
  };

  const handleTrackClick = (event: MouseEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    const chips = chipsRef.current;
    if (!track || !chips) return;
    const rect = track.getBoundingClientRect();
    const next = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    setProgress(next);
    chips.scrollTo({ left: next * (chips.scrollWidth - chips.clientWidth), behavior: 'smooth' });
  };

  return (
    <>
      <div
        ref={chipsRef}
        onScroll={handleScroll}
        className="no-scrollbar flex items-center gap-2 overflow-x-auto scroll-smooth px-4 pt-2 pb-4 -mb-2"
      >
        <button type="button" onClick={() => onChange('All')} className={chipClasses(value === 'All')}>
          <ChipFill active={value === 'All'} />
          <span className="relative">All</span>
        </button>
        {subjects.map((subject) => (
          <button
            key={subject.id}
            type="button"
            onClick={() => onChange(subject.id)}
            className={chipClasses(value === subject.id)}
          >
            <ChipFill active={value === subject.id} />
            <span
              style={{ backgroundColor: value === subject.id ? '#fff' : paletteFor(subject.category).dot }}
              className="relative inline-block size-2 shrink-0 rounded-full transition-colors duration-300"
            />
            <span className="relative">{subject.name}</span>
          </button>
        ))}
      </div>

      <div className="px-4 py-1.5">
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          className="relative h-[5px] w-full cursor-pointer rounded-full bg-[#DFDFDF]"
        >
          <div
            style={{ width: THUMB_WIDTH, left: `calc(${progress * 100}% - ${progress * THUMB_WIDTH}px)` }}
            className="absolute top-0 h-full rounded-full bg-linear-to-r from-brand-from to-brand-to transition-all duration-75"
          />
        </div>
      </div>
    </>
  );
}
