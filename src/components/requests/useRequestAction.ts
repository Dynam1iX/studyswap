'use client';

import { useRouter } from 'next/navigation';
import type { CardRequestAction } from '@/components/barter/BarterCard';
import type { FeedPost } from '@/lib/feed';
import { isOpenRequest, myRequestFor, useRequestsSnapshot } from '@/lib/requests';

/**
 * The card's "propose a swap" button: opens the request sheet, or, when I already
 * have an open request for this card, leads to it on the Requests page.
 * Nothing on my own cards.
 */
export function useRequestAction(
  post: FeedPost,
  onRequest: ((post: FeedPost) => void) | undefined,
): CardRequestAction | undefined {
  const router = useRouter();
  const { items, myId } = useRequestsSnapshot();
  if (!onRequest || !myId || post.author?.id === myId) return undefined;
  const mine = myRequestFor(items, post.id);
  if (mine && isOpenRequest(mine)) {
    return {
      state: mine.status === 'pending' ? 'sent' : 'accepted',
      onClick: () => router.push('/requests?tab=sent'),
    };
  }
  return { state: 'none', onClick: () => onRequest(post) };
}
