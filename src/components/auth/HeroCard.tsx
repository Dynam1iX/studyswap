'use client';

import { useEffect, useState } from 'react';
import { CATEGORY_PALETTE } from '@/lib/categoryPalette';
import type { Category } from '@/types/database';
import { ExchangeIcon } from '@/components/ui/ExchangeIcon';

interface Pair {
  needs: { title: string; category: Category };
  teaches: { title: string; category: Category };
}

/** Example swaps the card cycles through. */
const PAIRS: Pair[] = [
  { needs: { title: 'Calculus II', category: 'Mathematics' }, teaches: { title: 'ITP 1', category: 'CS & Dev' } },
  { needs: { title: 'English B2', category: 'Languages' }, teaches: { title: 'Linear Algebra', category: 'Mathematics' } },
  { needs: { title: 'OOP', category: 'CS & Dev' }, teaches: { title: 'History of Kazakhstan', category: 'Humanities' } },
  { needs: { title: 'Psychology', category: 'Humanities' }, teaches: { title: 'Chinese', category: 'Languages' } },
];

/** How long each pair stays (ms). */
const CYCLE_MS = 3200;

function Half({ label, subject, turn }: { label: string; subject: Pair['needs']; turn: number }) {
  const palette = CATEGORY_PALETTE[subject.category];
  return (
    <div
      style={{ backgroundColor: palette.bg }}
      className="flex flex-col gap-0.5 rounded-xl px-3 py-3 transition-colors duration-500"
    >
      <span style={{ color: palette.label }} className="text-[10px] font-semibold tracking-wider uppercase transition-colors duration-500">
        {label}
      </span>
      <span
        key={turn}
        style={{ color: palette.title }}
        className="animate-rise truncate text-base font-semibold transition-colors duration-500 motion-reduce:animate-none"
      >
        {subject.title}
      </span>
    </div>
  );
}

/** The tilted example card on the login page: it floats, and the swap changes every few seconds. */
export function HeroCard() {
  const [turn, setTurn] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setTurn((n) => n + 1), CYCLE_MS);
    return () => window.clearInterval(timer);
  }, []);

  const pair = PAIRS[turn % PAIRS.length];

  return (
    <div aria-hidden className="flex justify-center py-2">
      <div className="animate-float motion-reduce:animate-none">
        <div className="relative flex w-72 -rotate-4 flex-col gap-2 rounded-2xl bg-surface p-2 shadow-[0_8px_24px_rgba(60,30,110,0.16)]">
          <Half label="Needs help" subject={pair.needs} turn={turn} />
          <Half label="Can teach" subject={pair.teaches} turn={turn} />
          <span className="absolute top-1/2 right-6 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface">
            <ExchangeIcon
              style={{ transform: `rotate(${turn * 180}deg)` }}
              className="size-9 transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            />
          </span>
        </div>
      </div>
    </div>
  );
}
