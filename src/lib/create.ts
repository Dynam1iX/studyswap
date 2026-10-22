import { CURRENT_USER_EMAIL } from '@/lib/currentUser';
import { supabase } from '@/lib/supabase';
import type { NewBarterPost, Subject, User } from '@/types/database';

export type CreateAuthor = Pick<User, 'id' | 'full_name' | 'major' | 'study_year' | 'telegram_handle' | 'avatar_path'>;

export interface CreateFormData {
  /** Sorted by name for the selects. */
  subjects: Subject[];
  author: CreateAuthor | null;
}

/** Subjects for the selects and the author shown in the preview. */
export async function fetchCreateFormData(): Promise<CreateFormData> {
  const [subjectsRes, userRes] = await Promise.all([
    supabase.from('subjects').select('*').order('name', { ascending: true }),
    supabase
      .from('users')
      .select('id, full_name, major, study_year, telegram_handle, avatar_path')
      .eq('email', CURRENT_USER_EMAIL)
      .maybeSingle(),
  ]);

  let author = userRes.data as CreateAuthor | null;
  if (!author) {
    // Fall back to any account so the page still works on a fresh database.
    const { data } = await supabase.from('users').select('id, full_name, major, study_year, telegram_handle, avatar_path').limit(1).maybeSingle();
    author = data as CreateAuthor | null;
  }

  return { subjects: (subjectsRes.data ?? []) as Subject[], author };
}

export async function createBarterPost(post: NewBarterPost): Promise<void> {
  const { error } = await supabase.from('barter_posts').insert([post]);
  if (error) throw new Error(`Database error: ${error.message}`);
}
