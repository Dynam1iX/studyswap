import { BarterCard } from '@/components/barter/BarterCard';
import { CATEGORY_PALETTE } from '@/lib/categoryPalette';
import type { FeedPost } from '@/lib/feed';
import { formatStudyInfo, getInitials } from '@/lib/format';

interface FeedPostCardProps {
  post: FeedPost;
  liked: boolean;
  onToggleLike: (postId: string) => void;
}

function contactHref(post: FeedPost, authorName: string): string {
  if (post.contact_method === 'telegram') {
    return `https://t.me/${post.author?.telegram_handle || 'dynam1ix'}`;
  }
  const email = post.author?.email || 'student@astanait.edu.kz';
  const subjectName = post.needed?.name;
  const subject = encodeURIComponent(`StudySwap: ${subjectName || 'Academic Exchange'}`);
  const body = encodeURIComponent(
    `Hi ${authorName}! I saw your StudySwap offer for ${subjectName || 'this subject'}. I would like to connect!`,
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

/** Maps a post from the database onto the shared BarterCard. */
export function FeedPostCard({ post, liked, onToggleLike }: FeedPostCardProps) {
  const authorName = post.author?.full_name || 'AITU Student';

  return (
    <BarterCard
      author={{
        initials: getInitials(authorName),
        name: authorName,
        subtitle: formatStudyInfo(post.author?.major, post.author?.study_year),
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
      contactMethod={post.contact_method === 'telegram' ? 'telegram' : 'email'}
      contactHref={contactHref(post, authorName)}
      liked={liked}
      onToggleLike={() => onToggleLike(post.id)}
    />
  );
}
