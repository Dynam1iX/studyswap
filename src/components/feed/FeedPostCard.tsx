'use client';

import { BarterCard } from '@/components/barter/BarterCard';
import { paletteFor } from '@/lib/categoryPalette';
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
  /** false on the author's own page, where the name would lead back to it. */
  linkAuthor?: boolean;
}

/** Maps a post from the database onto the shared BarterCard. */
export function FeedPostCard({ post, liked, onToggleLike, onOpen, linkAuthor = true }: FeedPostCardProps) {
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
        // A subject the database did not return: say so instead of showing a made-up one.
        palette: paletteFor(post.needed?.category),
        title: post.needed?.name || t.details.notSpecified,
        topic: post.description || post.needed?.code || '',
        attachments: post.files.length,
      }}
      teaches={{
        palette: paletteFor(post.offered?.category),
        title: post.offered?.name || t.details.notSpecified,
        topic: post.offered_description || post.offered?.department || post.offered?.code || '',
      }}
      contactMethod={getContactMethod(post)}
      contactHref={getContactHref(post)}
      own={Boolean(myId) && post.author?.id === myId}
      liked={liked}
      onToggleLike={() => onToggleLike(post.id)}
      onOpen={() => onOpen(post)}
      openLabel={t.card.openDetailsOf(authorName)}
      authorLink={linkAuthor && post.author ? post.author : undefined}
    />
  );
}
