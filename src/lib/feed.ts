import { supabase } from '@/lib/supabase';
import type { BarterPost, ContactMethod, Subject, User } from '@/types/database';

export type FeedAuthor = Pick<User, 'id' | 'full_name' | 'email' | 'telegram_handle' | 'role' | 'major' | 'study_year'>;

/** One active barter post with its subjects and author, as the Feed shows it. */
export interface FeedPost
  extends Pick<BarterPost, 'id' | 'description' | 'offered_description' | 'contact_method' | 'created_at'> {
  needed: Subject | null;
  offered: Subject | null;
  author: FeedAuthor | null;
}

export interface FeedData {
  posts: FeedPost[];
  subjects: Subject[];
}

/** Columns of a Feed card: the post, both subjects and the author. */
export const FEED_POST_SELECT = `
        id,
        description,
        offered_description,
        contact_method,
        created_at,
        needed:subjects!barter_posts_needed_subject_id_fkey(id, code, name, category, department),
        offered:subjects!barter_posts_offered_subject_id_fkey(id, code, name, category, department),
        author:users!barter_posts_author_id_fkey(id, full_name, email, telegram_handle, role, major, study_year)
      `;

/** Active posts (newest first) and the subject catalogue for the filter chips. */
export async function fetchFeed(): Promise<FeedData> {
  const [postsRes, subjectsRes] = await Promise.all([
    supabase
      .from('barter_posts')
      .select(FEED_POST_SELECT)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase.from('subjects').select('id, code, name, category, department').order('id', { ascending: true }),
  ]);

  if (postsRes.error) throw postsRes.error;
  if (subjectsRes.error) throw subjectsRes.error;

  return {
    posts: (postsRes.data ?? []) as unknown as FeedPost[],
    subjects: (subjectsRes.data ?? []) as Subject[],
  };
}

/** Author name with the same fallback the cards use. */
export function getAuthorName(post: FeedPost): string {
  return post.author?.full_name || 'AITU Student';
}

/** How to contact the author: Telegram only when the author has a handle, otherwise e-mail. */
export function getContactMethod(post: FeedPost): ContactMethod {
  return post.contact_method === 'telegram' && post.author?.telegram_handle ? 'telegram' : 'email';
}

/** Telegram link or a prefilled mailto: link for the post's contact method. */
export function getContactHref(post: FeedPost): string {
  if (getContactMethod(post) === 'telegram') {
    return `https://t.me/${post.author?.telegram_handle}`;
  }
  const email = post.author?.email || 'student@astanait.edu.kz';
  const subjectName = post.needed?.name;
  const subject = encodeURIComponent(`StudySwap: ${subjectName || 'Academic Exchange'}`);
  const body = encodeURIComponent(
    `Hi ${getAuthorName(post)}! I saw your StudySwap offer for ${subjectName || 'this subject'}. I would like to connect!`,
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
