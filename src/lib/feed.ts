import { sortFiles, type CardFile } from '@/lib/cardFiles';
import { supabase } from '@/lib/supabase';
import { cardUrl } from '@/lib/cardLink';
import { messages } from '@/i18n';
import type { BarterPost, ContactMethod, Subject, User } from '@/types/database';

/** What other students may see about an author (see migration private_data). */
export type FeedAuthor = Pick<User, 'id' | 'full_name' | 'major' | 'study_year' | 'avatar_path'>;

/** How to reach the author of a card: a visible Telegram handle, or the university e-mail. */
export interface PostContact {
  method: ContactMethod;
  /** Handle without "@", or the e-mail address. */
  value: string;
}

/** One active barter post with its subjects and author, as the Feed shows it. */
export interface FeedPost
  extends Pick<BarterPost, 'id' | 'description' | 'offered_description' | 'contact_method' | 'created_at'> {
  needed: Subject | null;
  offered: Subject | null;
  author: FeedAuthor | null;
  /** null until get_post_contacts has answered (or for cards the database no longer shows). */
  contact: PostContact | null;
  /** Photos / PDFs with the tasks ("Needs help" side), oldest first. */
  files: CardFile[];
}

export interface FeedData {
  posts: FeedPost[];
  subjects: Subject[];
}

/**
 * Fills each post's contact. Neither e-mails nor Telegram handles are readable from the
 * users table: get_post_contacts returns the handle when the author chose Telegram and
 * lets this student see it, otherwise the e-mail (and never an e-mail for a Telegram card
 * that is shown through Telegram).
 */
export async function attachContacts(posts: Omit<FeedPost, 'contact'>[]): Promise<FeedPost[]> {
  if (posts.length === 0) return [];
  const { data, error } = await supabase.rpc('get_post_contacts', { p_post_ids: posts.map((post) => post.id) });
  if (error) throw error;
  const contacts = new Map(
    ((data ?? []) as { post_id: string; method: ContactMethod; contact: string }[]).map((row) => [
      row.post_id,
      { method: row.method, value: row.contact.replace(/^@/, '') },
    ]),
  );
  return posts.map((post) => ({ ...post, files: sortFiles(post.files), contact: contacts.get(post.id) ?? null }));
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
        author:users!barter_posts_author_id_fkey(id, full_name, major, study_year, avatar_path),
        files:card_files(id, path, name, kind, created_at)
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
    posts: await attachContacts((postsRes.data ?? []) as unknown as Omit<FeedPost, 'contact'>[]),
    subjects: (subjectsRes.data ?? []) as Subject[],
  };
}

/** Author name with the same fallback the cards use. */
export function getAuthorName(post: FeedPost): string {
  return post.author?.full_name || 'AITU Student';
}

/** How to contact the author (e-mail until the contact is known). */
export function getContactMethod(post: FeedPost): ContactMethod {
  return post.contact?.method ?? 'email';
}

/**
 * Telegram link or a prefilled mailto: link for the post's contact method; undefined
 * while the contact is unknown (no e-mail address to write to yet).
 */
export function getContactHref(post: FeedPost): string | undefined {
  if (!post.contact) return undefined;
  if (post.contact?.method === 'telegram') {
    // The message carries the card's link: Telegram shows the card as a picture under it,
    // so the author knows which swap the message is about.
    const text = encodeURIComponent(messages().card.telegramMessage(cardUrl(post)));
    return `https://t.me/${post.contact.value}?text=${text}`;
  }
  const email = post.contact.value;
  const subjectName = post.needed?.name;
  const subject = encodeURIComponent(`StudySwap: ${subjectName || 'Academic Exchange'}`);
  const body = encodeURIComponent(
    `Hi ${getAuthorName(post)}! I saw your StudySwap offer for ${subjectName || 'this subject'}. I would like to connect!`,
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
