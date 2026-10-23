'use client';

import { Loader2, SearchX, X } from 'lucide-react';
import { FeedPostCard } from '@/components/feed/FeedPostCard';
import type { FeedPost } from '@/lib/feed';
import type { SearchFilters } from '@/lib/search';
import { categoryTitle } from './CategoryGrid';

type FilterKey = keyof SearchFilters;

interface SearchResultsProps {
  filters: SearchFilters;
  /** null while the cards are loading. */
  posts: FeedPost[] | null;
  likedPosts: Set<string>;
  onToggleLike: (postId: string) => void;
  onOpen: (post: FeedPost) => void;
  onClearFilter: (key: FilterKey) => void;
  onClearAll: () => void;
}

function activeChips(filters: SearchFilters): { key: FilterKey; label: string }[] {
  const chips: { key: FilterKey; label: string }[] = [];
  if (filters.query) chips.push({ key: 'query', label: `“${filters.query}”` });
  if (filters.category) chips.push({ key: 'category', label: categoryTitle(filters.category) });
  if (filters.year) chips.push({ key: 'year', label: `Year ${filters.year}` });
  if (filters.program) chips.push({ key: 'program', label: filters.program });
  return chips;
}

/** Cards that match the submitted search and filters. */
export function SearchResults({
  filters,
  posts,
  likedPosts,
  onToggleLike,
  onOpen,
  onClearFilter,
  onClearAll,
}: SearchResultsProps) {
  const chips = activeChips(filters);

  return (
    <section aria-live="polite" className="flex animate-rise flex-col gap-4 motion-reduce:animate-none">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bricolage text-xl font-extrabold text-ink">
          {posts === null ? 'Results' : `${posts.length} ${posts.length === 1 ? 'result' : 'results'}`}
        </h2>
        <button
          type="button"
          onClick={onClearAll}
          className="h-11 cursor-pointer px-1 text-xs font-bold transition active:scale-95"
        >
          <span className="bg-linear-to-r from-brand-from to-brand-to bg-clip-text text-transparent">Reset</span>
        </button>
      </div>

      {chips.length > 0 && (
        <div className="no-scrollbar -mx-4 -mt-2 flex gap-2 overflow-x-auto px-4">
          {chips.map((chip, index) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onClearFilter(chip.key)}
              aria-label={`Remove filter ${chip.label}`}
              style={{ animationDelay: `${index * 50}ms` }}
              className="flex h-9 shrink-0 animate-pop cursor-pointer items-center gap-1.5 rounded-full bg-ink py-0 pr-2.5 pl-3.5 text-[13px] font-semibold text-page transition active:scale-95 motion-reduce:animate-none"
            >
              <span className="max-w-[200px] truncate">{chip.label}</span>
              <X aria-hidden className="size-3.5 opacity-70" strokeWidth={2.6} />
            </button>
          ))}
        </div>
      )}

      {posts === null ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted">
          <Loader2 className="size-6 animate-spin text-brand-from" />
          <span className="text-xs font-medium">Searching barter offers...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex animate-pop flex-col items-center gap-2 rounded-3xl border border-dashed border-line-strong bg-surface/60 px-6 py-10 text-center motion-reduce:animate-none">
          <span className="flex size-14 animate-float items-center justify-center rounded-full bg-soft motion-reduce:animate-none">
            <SearchX aria-hidden className="size-6 text-brand-from" strokeWidth={2} />
          </span>
          <p className="text-sm font-bold text-ink">Nothing found</p>
          <p className="text-xs font-medium text-muted">Try another subject or remove a filter.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {posts.map((post, index) => (
            <li
              key={post.id}
              style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
              className="animate-rise motion-reduce:animate-none"
            >
              <FeedPostCard
                post={post}
                liked={likedPosts.has(post.id)}
                onToggleLike={onToggleLike}
                onOpen={onOpen}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
