import { supabase } from '@/lib/supabase';
import type { BarterPost, Subject, User } from '@/types/database';

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

/** Active posts (newest first) and the subject catalogue for the filter chips. */
export async function fetchFeed(): Promise<FeedData> {
  const [postsRes, subjectsRes] = await Promise.all([
    supabase
      .from('barter_posts')
      .select(`
        id,
        description,
        offered_description,
        contact_method,
        created_at,
        needed:subjects!barter_posts_needed_subject_id_fkey(id, code, name, category, department),
        offered:subjects!barter_posts_offered_subject_id_fkey(id, code, name, category, department),
        author:users!barter_posts_author_id_fkey(id, full_name, email, telegram_handle, role, major, study_year)
      `)
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
