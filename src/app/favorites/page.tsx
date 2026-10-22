'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { UndoToast } from '@/components/favorites/UndoToast';
import { FeedPostCard } from '@/components/feed/FeedPostCard';
import { FeedSkeleton } from '@/components/feed/FeedSkeleton';
import { SwapDetailModal } from '@/components/feed/SwapDetailModal';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { MobileShell } from '@/components/layout/MobileShell';
import { addFavorite, fetchFavoritePosts, removeFavorite } from '@/lib/favorites';
import type { FeedPost } from '@/lib/feed';

/** Must match duration-300 on the card wrapper. */
const EXIT_MS = 300;

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; posts: FeedPost[] };

/** The last removed card and where it was, so Undo can put it back in place. */
interface Removed {
  post: FeedPost;
  index: number;
  /** Unique per removal; restarts the toast timer. */
  key: string;
}

function SavedBadge({ count }: { count: number }) {
  return (
    <span
      // A new key pops the badge every time the number changes.
      key={count}
      className="flex h-8 shrink-0 animate-pop items-center rounded-2xl bg-[#F3E8FF] px-3.5 text-xs font-bold motion-reduce:animate-none"
    >
      <span className="bg-linear-to-r from-brand-from to-brand-to bg-clip-text text-transparent">
        {count} saved
      </span>
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex animate-pop flex-col items-center gap-3 rounded-3xl border border-dashed border-line-strong bg-white/60 px-6 py-12 text-center motion-reduce:animate-none">
      <span className="flex size-16 items-center justify-center rounded-full bg-[#F3E8FF]">
        <Heart
          aria-hidden
          className="size-7 animate-breathe fill-brand-to/15 text-brand-to motion-reduce:animate-none"
          strokeWidth={2.2}
        />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-bricolage text-lg font-extrabold text-ink">No favorites yet</p>
        <p className="text-sm font-medium text-muted">Tap the heart on a card in the Feed to save it here.</p>
      </div>
      <Link
        href="/"
        className="shine mt-1 flex h-11 items-center rounded-xl bg-linear-to-r from-brand-from to-brand-to px-5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(173,70,255,0.3)] transition active:scale-95"
      >
        Go to Feed
      </Link>
    </div>
  );
}

export default function FavoritesPage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  /** Cards playing their exit animation. */
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const [removed, setRemoved] = useState<Removed | null>(null);
  /** The card whose details modal is open, or null. */
  const [activeSwap, setActiveSwap] = useState<FeedPost | null>(null);
  const timers = useRef<number[]>([]);
  const removals = useRef(0);

  useEffect(() => {
    let cancelled = false;
    fetchFavoritePosts()
      .then((posts) => {
        if (!cancelled) setState({ status: 'ready', posts });
      })
      .catch((err: unknown) => {
        console.error('Error loading favorites:', err);
        if (!cancelled) {
          setState({ status: 'error', message: err instanceof Error ? err.message : 'Could not load favorites' });
        }
      });
    const pending = timers.current;
    return () => {
      cancelled = true;
      pending.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  // Next.js keeps this page alive (hidden) after navigating away: drop the Undo toast then.
  useLayoutEffect(() => () => setRemoved(null), []);

  const posts = state.status === 'ready' ? state.posts : [];
  const savedCount = posts.filter((post) => !leaving.has(post.id)).length;

  /** Unlike: the card slides out and collapses, the toast offers Undo. */
  const unlike = (post: FeedPost) => {
    if (leaving.has(post.id)) return;
    const index = posts.findIndex((p) => p.id === post.id);
    setLeaving((prev) => new Set(prev).add(post.id));
    removals.current += 1;
    setRemoved({ post, index, key: `${post.id}-${removals.current}` });
    removeFavorite(post.id).catch((err: unknown) => console.error('Error removing favorite:', err));

    timers.current.push(
      window.setTimeout(() => {
        setState((prev) =>
          prev.status === 'ready' ? { status: 'ready', posts: prev.posts.filter((p) => p.id !== post.id) } : prev,
        );
        setLeaving((prev) => {
          const next = new Set(prev);
          next.delete(post.id);
          return next;
        });
      }, EXIT_MS),
    );
  };

  const undo = () => {
    if (!removed) return;
    const { post, index } = removed;
    setRemoved(null);
    addFavorite(post.id).catch((err: unknown) => console.error('Error restoring favorite:', err));
    setLeaving((prev) => {
      const next = new Set(prev);
      next.delete(post.id);
      return next;
    });
    setState((prev) => {
      if (prev.status !== 'ready') return prev;
      if (prev.posts.some((p) => p.id === post.id)) return prev; // still on screen (undo during the exit)
      const next = [...prev.posts];
      next.splice(Math.min(index, next.length), 0, post);
      return { status: 'ready', posts: next };
    });
  };

  const expire = useCallback(() => setRemoved(null), []);

  const footer = (
    <div className="relative">
      <UndoToast
        toastKey={removed?.key ?? null}
        message="Removed from favorites"
        onUndo={undo}
        onExpire={expire}
      />
      <BottomNav active="favorite" />
    </div>
  );

  return (
    <MobileShell footer={footer}>
      <AppHeader />

      {/* 16px sides, 8px top and bottom, 16px between blocks. */}
      <div className="flex flex-col gap-4 px-4 py-2">
        <div className="flex animate-rise items-end justify-between gap-3 motion-reduce:animate-none">
          <div className="flex flex-col gap-1">
            <h1 className="font-bricolage text-3xl leading-8 font-extrabold text-ink">Favorite</h1>
            <p className="text-sm font-semibold text-muted">Cards you liked in the feed</p>
          </div>
          {state.status === 'ready' && savedCount > 0 && <SavedBadge count={savedCount} />}
        </div>

        {state.status === 'loading' && <FeedSkeleton count={2} />}

        {state.status === 'error' && (
          <p className="rounded-2xl border border-[#F2C6D4] bg-white p-6 text-center text-sm font-medium text-[#C0264B]">
            {state.message}
          </p>
        )}

        {state.status === 'ready' && savedCount === 0 && posts.length === 0 && <EmptyState />}

        {state.status === 'ready' && posts.length > 0 && (
          <ul className="flex flex-col overflow-x-clip">
            {posts.map((post, index) => {
              const isLeaving = leaving.has(post.id);
              return (
                <li
                  key={post.id}
                  className={`grid grid-cols-[minmax(0,1fr)] transition-[grid-template-rows,opacity] duration-300 ease-out ${
                    isLeaving ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
                  }`}
                >
                  {/* Clip only while collapsing, so card shadows and the like burst are not cut off. */}
                  <div className={`min-h-0 ${isLeaving ? 'overflow-hidden' : ''}`}>
                    <div
                      style={{ animationDelay: `${80 + Math.min(index, 5) * 70}ms` }}
                      className={`animate-rise pb-4 transition-transform duration-300 ease-out motion-reduce:animate-none ${
                        isLeaving ? 'translate-x-12' : 'translate-x-0'
                      }`}
                    >
                      <FeedPostCard
                        post={post}
                        liked={!isLeaving}
                        onToggleLike={() => unlike(post)}
                        onOpen={setActiveSwap}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <SwapDetailModal post={activeSwap} onClose={() => setActiveSwap(null)} />
    </MobileShell>
  );
}
