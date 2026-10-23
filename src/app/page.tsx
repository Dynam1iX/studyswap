'use client';

import { useEffect, useState } from 'react';
import { FeedPostCard } from '@/components/feed/FeedPostCard';
import { FeedSkeleton } from '@/components/feed/FeedSkeleton';
import { SubjectFilter, type SubjectFilterValue } from '@/components/feed/SubjectFilter';
import { SwapDetailModal } from '@/components/feed/SwapDetailModal';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { MobileShell } from '@/components/layout/MobileShell';
import { useFavoriteIds } from '@/lib/favorites';
import { fetchFeed, type FeedPost } from '@/lib/feed';
import type { Subject } from '@/types/database';

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<SubjectFilterValue>('All');
  const { liked: likedPosts, toggle: toggleLike } = useFavoriteIds();
  /** The card whose details modal is open, or null. */
  const [activeSwap, setActiveSwap] = useState<FeedPost | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchFeed()
      .then((data) => {
        if (cancelled) return;
        setPosts(data.posts);
        setSubjects(data.subjects);
      })
      .catch((err: unknown) => console.error('Error fetching data from Supabase:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visiblePosts =
    selectedSubject === 'All'
      ? posts
      : posts.filter((post) => post.needed?.id === selectedSubject || post.offered?.id === selectedSubject);

  return (
    <MobileShell footer={<BottomNav active="feed" />}>
      <AppHeader />
      <div className="animate-rise motion-reduce:animate-none">
        <SubjectFilter subjects={subjects} value={selectedSubject} onChange={setSelectedSubject} />
      </div>

      <div style={{ animationDelay: '80ms' }} className="animate-rise px-4 pt-3 pb-1 motion-reduce:animate-none">
        <h1 className="font-bricolage text-[22px] leading-[26px] font-bold text-ink">Matches for you</h1>
      </div>

      {/* key: the list fades in again whenever the subject filter changes */}
      <main key={String(selectedSubject)} className="w-full space-y-4 p-4">
        {loading ? (
          <FeedSkeleton />
        ) : visiblePosts.length === 0 ? (
          <div className="animate-pop rounded-2xl border border-line bg-surface p-6 py-16 text-center text-xs font-medium text-muted motion-reduce:animate-none">
            No barter offers found for this subject
          </div>
        ) : (
          visiblePosts.map((post, index) => (
            <div
              key={post.id}
              style={{ animationDelay: `${120 + Math.min(index, 5) * 70}ms` }}
              className="animate-rise motion-reduce:animate-none"
            >
              <FeedPostCard
                post={post}
                liked={likedPosts.has(post.id)}
                onToggleLike={toggleLike}
                onOpen={setActiveSwap}
              />
            </div>
          ))
        )}
      </main>

      <SwapDetailModal post={activeSwap} onClose={() => setActiveSwap(null)} />

    </MobileShell>
  );
}
