'use client';

import { useState } from 'react';
import { BookOpen, Calculator, Code2, Globe, type LucideIcon } from 'lucide-react';
import { CATEGORY_PALETTE } from '@/lib/categoryPalette';
import { SEARCH_CATEGORIES } from '@/lib/search';
import type { Category } from '@/types/database';
import { useT } from '@/i18n';

interface SearchCategory {
  id: Category;
  icon: LucideIcon;
}

/** Card texts and icons; colours come from CATEGORY_PALETTE like the barter cards. */
const CATEGORY_CARDS: Record<Category, SearchCategory> = {
  'CS & Dev': { id: 'CS & Dev', icon: Code2 },
  Languages: { id: 'Languages', icon: Globe },
  Humanities: { id: 'Humanities', icon: BookOpen },
  Mathematics: { id: 'Mathematics', icon: Calculator },
};

interface CategoryGridProps {
  /** Active cards per category; null while loading. */
  counts: Record<Category, number> | null;
  onSelect: (category: Category) => void;
  /** Delay (ms) before the first card appears, to follow the blocks above. */
  delay?: number;
}

function CategoryCard({
  category,
  count,
  index,
  delay,
  onSelect,
}: {
  category: SearchCategory;
  count: number | null;
  index: number;
  delay: number;
  onSelect: () => void;
}) {
  const t = useT();
  const palette = CATEGORY_PALETTE[category.id];
  const Icon = category.icon;
  const [wiggle, setWiggle] = useState(0);

  return (
    <button
      type="button"
      onClick={() => {
        setWiggle((n) => n + 1);
        // Let the icon wiggle start before the results replace the grid.
        window.setTimeout(onSelect, 220);
      }}
      style={{ backgroundColor: palette.bg, animationDelay: `${delay + index * 70}ms` }}
      className="group relative flex h-36 animate-rise cursor-pointer flex-col items-start justify-between overflow-hidden rounded-3xl p-3.5 text-left transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(60,30,110,0.12)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-from motion-reduce:animate-none"
    >
      {/* Soft light that sweeps across on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-white/40 opacity-0 blur-2xl dark:bg-white/[0.06] transition-opacity duration-500 group-hover:opacity-100"
      />

      <span className="relative flex size-10 items-center justify-center rounded-[20px] bg-surface shadow-[0_2px_6px_rgba(60,30,110,0.06)] transition-transform duration-300 group-hover:scale-105">
        <Icon
          key={wiggle}
          aria-hidden
          style={{ color: palette.title }}
          className={`size-5 ${wiggle ? 'animate-wiggle motion-reduce:animate-none' : ''}`}
          strokeWidth={2.2}
        />
      </span>

      <span className="relative flex flex-col gap-1">
        <span style={{ color: palette.title }} className="font-bricolage text-base leading-5 font-extrabold">
          {t.search.categoryTitles[category.id]}
        </span>
        {count === null ? (
          <span
            aria-hidden
            className="h-3.5 w-16 animate-shimmer rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.35),rgba(255,255,255,0.8),rgba(255,255,255,0.35))] dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.04),rgba(255,255,255,0.14),rgba(255,255,255,0.04))] bg-[length:200%_100%]"
          />
        ) : (
          <span style={{ color: palette.label }} className="text-xs font-semibold">
            {t.common.cards(count)}
          </span>
        )}
      </span>
    </button>
  );
}

/** "Browse categories": 2×2 grid of subject categories. */
export function CategoryGrid({ counts, onSelect, delay = 0 }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3.5">
      {SEARCH_CATEGORIES.map((id, index) => (
        <CategoryCard
          key={id}
          category={CATEGORY_CARDS[id]}
          count={counts ? counts[id] : null}
          index={index}
          delay={delay}
          onSelect={() => onSelect(id)}
        />
      ))}
    </div>
  );
}

