import { supabase } from '@/lib/supabase';
import type { BarterPost, ContactMethod, Subject, User } from '@/types/database';

export type FeedAuthor = Pick<
  User,
  'id' | 'full_name' | 'email' | 'telegram_handle' | 'telegram_visibility' | 'role' | 'major' | 'study_year' | 'avatar_path'
>;

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

/**
 * Telegram handles are not readable from the users table; the database returns only
 * the ones this student may see (see get_telegram_handles). Fills author.telegram_handle.
 */
export async function attachTelegramHandles(posts: FeedPost[]): Promise<FeedPost[]> {
  const ids = [...new Set(posts.flatMap((post) => (post.author ? [post.author.id] : [])))];
  if (ids.length === 0) return posts;
  const handles = await fetchTelegramHandles(ids);
  return posts.map((post) =>
    post.author ? { ...post, author: { ...post.author, telegram_handle: handles.get(post.author.id) ?? null } } : post,
  );
}

/** id → handle (without "@") for the students whose Telegram the caller may see. */
export async function fetchTelegramHandles(ids: string[]): Promise<Map<string, string>> {
  const { data, error } = await supabase.rpc('get_telegram_handles', { p_ids: ids });
  if (error) throw error;
  return new Map(
    ((data ?? []) as { id: string; telegram_handle: string }[]).map((row) => [row.id, row.telegram_handle.replace(/^@/, '')]),
  );
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
        author:users!barter_posts_author_id_fkey(id, full_name, email, telegram_visibility, role, major, study_year, avatar_path)
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
    posts: await attachTelegramHandles((postsRes.data ?? []) as unknown as FeedPost[]),
    subjects: (subjectsRes.data ?? []) as Subject[],
  };
}

/** Author name with the same fallback the cards use. */
export function getAuthorName(post: FeedPost): string {
  return post.author?.full_name || 'AITU Student';
}

/**
 * How to contact the author: Telegram only when the author has a handle and shows it
 * to everyone, otherwise e-mail. ("accepted" will reveal it after an accepted swap
 * request once requests exist in the app.)
 */
export function getContactMethod(post: FeedPost): ContactMethod {
  const author = post.author;
  return post.contact_method === 'telegram' && author?.telegram_handle && author.telegram_visibility !== 'accepted'
    ? 'telegram'
    : 'email';
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
