'use client';

import { useEffect, useRef, useState } from 'react';
import { Clock, History, X } from 'lucide-react';
import type { RecentSearch } from '@/lib/search';

/** Must match duration-300 on the rows. */
const EXIT_MS = 300;
/** Pause between rows when everything is cleared. */
const CLEAR_STAGGER_MS = 60;

interface RecentSearchesProps {
  /** null while loading. */
  items: RecentSearch[] | null;
  onPick: (query: string) => void;
  /** Called once the row has animated out. */
  onRemove: (id: string) => void;
  /** Called once every row has animated out. */
  onClearAll: () => void;
  /** Delay (ms) before the section appears, to follow the blocks above. */
  delay?: number;
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="font-bricolage text-xl font-extrabold text-ink">{children}</h2>;
}

/** Recent searches: tap to reuse, × to remove one, "Clear all" to remove every one. */
export function RecentSearches({ items, onPick, onRemove, onClearAll, delay = 0 }: RecentSearchesProps) {
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const remove = (id: string) => {
    if (leaving.has(id)) return;
    setLeaving((prev) => new Set(prev).add(id));
    later(() => {
      onRemove(id);
      setLeaving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, EXIT_MS);
  };

  const clearAll = () => {
    if (!items?.length) return;
    items.forEach((item, index) => {
      later(() => setLeaving((prev) => new Set(prev).add(item.id)), index * CLEAR_STAGGER_MS);
    });
    later(() => {
      onClearAll();
      setLeaving(new Set());
    }, (items.length - 1) * CLEAR_STAGGER_MS + EXIT_MS);
  };

  const hasItems = Boolean(items && items.length > 0);

  return (
    <section
      style={{ animationDelay: `${delay}ms` }}
      className="flex animate-rise flex-col gap-2 motion-reduce:animate-none"
    >
      <div className="flex items-center justify-between">
        <SectionTitle>Recent searches</SectionTitle>
        {hasItems && (
          <button
            type="button"
            onClick={clearAll}
            className="h-11 animate-pop cursor-pointer px-1 text-xs font-bold transition active:scale-95 motion-reduce:animate-none"
          >
            <span className="bg-linear-to-r from-brand-from to-brand-to bg-clip-text text-transparent">Clear all</span>
          </button>
        )}
      </div>

      {items === null ? (
        <div aria-hidden className="flex flex-col">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex h-14 items-center gap-3 border-b border-line last:border-b-0">
              <span className="size-5 rounded-full bg-soft" />
              <span
                style={{ width: `${45 - row * 8}%` }}
                className="h-4 animate-shimmer rounded-full bg-[linear-gradient(90deg,var(--color-soft),var(--color-line-strong),var(--color-soft))] bg-[length:200%_100%]"
              />
            </div>
          ))}
        </div>
      ) : hasItems ? (
        <ul className="flex flex-col pb-3">
          {items!.map((item, index) => {
            const isLeaving = leaving.has(item.id);
            const isLast = index === items!.length - 1;
            return (
              <li
                key={item.id}
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                  isLeaving ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
                }`}
              >
                <div className="min-h-0 overflow-hidden">
                  <div
                    className={`flex h-14 animate-rise items-center justify-between gap-2 transition-transform duration-300 ease-out motion-reduce:animate-none ${
                      isLast ? '' : 'border-b border-line'
                    } ${isLeaving ? 'translate-x-10' : 'translate-x-0'}`}
                    style={{ animationDelay: `${delay + 60 + index * 50}ms` }}
                  >
                    <button
                      type="button"
                      onClick={() => onPick(item.query)}
                      className="group flex h-full min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                    >
                      <Clock
                        aria-hidden
                        className="size-5 shrink-0 text-muted transition-[color,transform] duration-300 group-hover:-rotate-45 group-hover:text-brand-from"
                        strokeWidth={2}
                      />
                      <span className="truncate text-base font-semibold text-ink">{item.query}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      aria-label={`Remove "${item.query}" from recent searches`}
                      className="-mr-3 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition hover:bg-soft hover:text-ink active:scale-90"
                    >
                      <X className="size-4" strokeWidth={2.4} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex animate-pop flex-col items-center gap-2 rounded-3xl border border-dashed border-line-strong bg-white/60 px-6 py-8 text-center motion-reduce:animate-none">
          <span className="flex size-14 animate-float items-center justify-center rounded-full bg-soft motion-reduce:animate-none">
            <History aria-hidden className="size-6 text-brand-from" strokeWidth={2} />
          </span>
          <p className="text-sm font-bold text-ink">No recent searches</p>
          <p className="text-xs font-medium text-muted">Your searches will show up here.</p>
        </div>
      )}
    </section>
  );
}
