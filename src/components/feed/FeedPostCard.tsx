'use client';

import { BarterCard } from '@/components/barter/BarterCard';
import { CATEGORY_PALETTE } from '@/lib/categoryPalette';
import { useMyId } from '@/lib/auth';
import { getAuthorName, getContactHref, getContactMethod, type FeedPost } from '@/lib/feed';
import { formatStudyInfo, getInitials } from '@/lib/format';
import { useT } from '@/i18n';

interface FeedPostCardProps {
  post: FeedPost;
  liked: boolean;
  onToggleLike: (postId: string) => void;
  /** Called when the card itself is clicked (opens the details modal). */
  onOpen: (post: FeedPost) => void;
}

/** Maps a post from the database onto the shared BarterCard. */
export function FeedPostCard({ post, liked, onToggleLike, onOpen }: FeedPostCardProps) {
  const t = useT();
  const authorName = getAuthorName(post);
  const myId = useMyId();

  return (
    <BarterCard
      author={{
        initials: getInitials(authorName),
        avatarPath: post.author?.avatar_path,
        name: authorName,
        subtitle: formatStudyInfo(t, post.author?.major, post.author?.study_year),
      }}
      needs={{
        palette: post.needed ? CATEGORY_PALETTE[post.needed.category] : CATEGORY_PALETTE.Mathematics,
        title: post.needed?.name || 'Calculus I',
        topic: post.description || post.needed?.code || 'Details & topics',
      }}
      teaches={{
        palette: post.offered ? CATEGORY_PALETTE[post.offered.category] : CATEGORY_PALETTE['CS & Dev'],
        title: post.offered?.name || 'Introduction to Programming 1',
        topic: post.offered_description || post.offered?.department || post.offered?.code || 'Topics & skills',
      }}
      contactMethod={getContactMethod(post)}
      contactHref={getContactHref(post)}
      own={Boolean(myId) && post.author?.id === myId}
      liked={liked}
      onToggleLike={() => onToggleLike(post.id)}
      onOpen={() => onOpen(post)}
      openLabel={t.card.openDetailsOf(authorName)}
    />
  );
}
