'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FEED_POST_SELECT, attachContacts, type FeedPost } from '@/lib/feed';
import { supabase } from '@/lib/supabase';

/** Fired on window when a card is liked, so the nav can bounce its Favorite tab. */
export const FAVORITE_ADDED_EVENT = 'studyswap:favorite-added';

// ---------------------------------------------------------------------------
// Supabase (table favorites, reached only through these functions)
// ---------------------------------------------------------------------------

/** Ids of the current student's liked cards, newest like first. */
export async function fetchFavoriteIds(): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_favorites');
  if (error) throw error;
  return ((data ?? []) as { post_id: string }[]).map((row) => row.post_id);
}

export async function addFavorite(postId: string): Promise<void> {
  const { error } = await supabase.rpc('add_favorite', { p_post_id: postId });
  if (error) throw error;
}

export async function removeFavorite(postId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_favorite', { p_post_id: postId });
  if (error) throw error;
}

/**
 * The liked cards themselves, in like order (newest first).
 * Cards that are no longer active are hidden by RLS and simply left out.
 */
export async function fetchFavoritePosts(): Promise<FeedPost[]> {
  const ids = await fetchFavoriteIds();
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('barter_posts')
    .select(FEED_POST_SELECT)
    .in('id', ids)
    .eq('status', 'active');
  if (error) throw error;
  const byId = new Map(((data ?? []) as unknown as Omit<FeedPost, 'contact'>[]).map((post) => [post.id, post]));
  return attachContacts(
    ids.flatMap((id) => {
      const post = byId.get(id);
      return post ? [post] : [];
    }),
  );
}

// ---------------------------------------------------------------------------
// Shared like state for the Feed and Search pages
// ---------------------------------------------------------------------------

/**
 * Liked card ids, loaded from Supabase. toggle() updates the heart at once and
 * rolls it back if the database call fails.
 */
export function useFavoriteIds() {
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const likedRef = useRef(liked);
  useEffect(() => {
    likedRef.current = liked;
  }, [liked]);

  useEffect(() => {
    let cancelled = false;
    fetchFavoriteIds()
      .then((ids) => {
        if (!cancelled) setLiked(new Set(ids));
      })
      .catch((err: unknown) => console.error('Error loading favorites:', err));
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback((postId: string) => {
    const wasLiked = likedRef.current.has(postId);
    const flip = (like: boolean) =>
      setLiked((prev) => {
        const next = new Set(prev);
        if (like) next.add(postId);
        else next.delete(postId);
        return next;
      });

    flip(!wasLiked);
    if (!wasLiked) window.dispatchEvent(new Event(FAVORITE_ADDED_EVENT));

    (wasLiked ? removeFavorite(postId) : addFavorite(postId)).catch((err: unknown) => {
      console.error('Error saving favorite:', err);
      flip(wasLiked);
    });
  }, []);

  return { liked, toggle };
}
