'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { FeedPostCard } from '@/components/feed/FeedPostCard';
import { SubjectFilter, type SubjectFilterValue } from '@/components/feed/SubjectFilter';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { MobileShell } from '@/components/layout/MobileShell';
import { fetchFeed, type FeedPost } from '@/lib/feed';
import type { Subject } from '@/types/database';

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<SubjectFilterValue>('All');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

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

  const toggleLike = (postId: string) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const visiblePosts =
    selectedSubject === 'All'
      ? posts
      : posts.filter((post) => post.needed?.id === selectedSubject || post.offered?.id === selectedSubject);

  return (
    <MobileShell>
      <AppHeader />
      <SubjectFilter subjects={subjects} value={selectedSubject} onChange={setSelectedSubject} />

      <div className="px-4 pt-3 pb-1">
        <h1 className="font-bricolage text-[22px] leading-[26px] font-bold text-black">Matches for you</h1>
      </div>

      <main className="w-full space-y-4 p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted">
            <Loader2 className="size-6 animate-spin text-brand-from" />
            <span className="text-xs font-medium">Loading barter offers...</span>
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-6 py-16 text-center text-xs font-medium text-muted">
            No barter offers found for this subject
          </div>
        ) : (
          visiblePosts.map((post) => (
            <FeedPostCard key={post.id} post={post} liked={likedPosts.has(post.id)} onToggleLike={toggleLike} />
          ))
        )}
      </main>

      <BottomNav active="feed" />
    </MobileShell>
  );
}
