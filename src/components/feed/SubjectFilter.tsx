'use client';

import { useRef, useState, type PointerEvent } from 'react';
import { paletteFor } from '@/lib/categoryPalette';
import type { Subject } from '@/types/database';
import { useT } from '@/i18n';

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
      : 'border-line-strong bg-surface text-ink'
  }`;
}

/** Gradient fill that fades in on the selected chip. */
function ChipFill({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={`absolute inset-0 bg-linear-to-r from-brand-fill-from to-brand-fill-to transition-opacity duration-300 ${
        active ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
}

/** Horizontally scrolling subject chips with a gradient slider underneath. */
export function SubjectFilter({ subjects, value, onChange }: SubjectFilterProps) {
  const t = useT();
  const chipsRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const handleScroll = () => {
    const chips = chipsRef.current;
    if (!chips) return;
    const maxScroll = chips.scrollWidth - chips.clientWidth;
    if (maxScroll > 0) setProgress(chips.scrollLeft / maxScroll);
  };

  /** Where the pointer holds the thumb (px from its left edge) while dragging, or null. */
  const grab = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);

  /** Puts the thumb under the pointer and scrolls the chips to match. */
  const moveTo = (clientX: number, smooth: boolean) => {
    const track = trackRef.current;
    const chips = chipsRef.current;
    if (!track || !chips || grab.current === null) return;
    const rect = track.getBoundingClientRect();
    const room = rect.width - THUMB_WIDTH;
    const next = room > 0 ? Math.max(0, Math.min(1, (clientX - rect.left - grab.current) / room)) : 0;
    setProgress(next);
    chips.scrollTo({ left: next * (chips.scrollWidth - chips.clientWidth), behavior: smooth ? 'smooth' : 'instant' });
  };

  // Press the thumb and drag it (mouse or finger); pressing the track jumps there first.
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track) return;
    const thumbLeft = track.getBoundingClientRect().left + progress * (track.clientWidth - THUMB_WIDTH);
    const offset = event.clientX - thumbLeft;
    const onThumb = offset >= 0 && offset <= THUMB_WIDTH;
    grab.current = onThumb ? offset : THUMB_WIDTH / 2;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (!onThumb) moveTo(event.clientX, true);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (grab.current !== null) moveTo(event.clientX, false);
  };
  const onPointerUp = () => {
    grab.current = null;
    setDragging(false);
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
          <span className="relative">{t.feed.all}</span>
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

      {/* The whole strip is the grab area (taller than the 5px line) */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`group touch-none px-4 py-1.5 select-none ${dragging ? 'cursor-grabbing' : 'cursor-pointer'}`}
      >
        <div ref={trackRef} className="relative h-[5px] w-full rounded-full bg-line-strong">
          <div
            style={{ width: THUMB_WIDTH, left: `calc(${progress * 100}% - ${progress * THUMB_WIDTH}px)` }}
            className={`absolute top-0 h-full rounded-full bg-linear-to-r from-brand-from to-brand-to transition-transform duration-200 group-hover:scale-y-[1.6] ${
              dragging ? 'scale-y-[1.6] cursor-grabbing' : 'cursor-grab'
            }`}
          />
        </div>
      </div>
    </>
  );
}
