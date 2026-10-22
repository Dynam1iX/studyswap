import { currentEmail } from '@/lib/auth';
import { fetchTelegramHandles } from '@/lib/feed';
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
  const email = await currentEmail();
  const [subjectsRes, userRes] = await Promise.all([
    supabase.from('subjects').select('*').order('name', { ascending: true }),
    email
      ? supabase
          .from('users')
          .select('id, full_name, major, study_year, avatar_path')
          .eq('email', email)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const row = userRes.data as Omit<CreateAuthor, 'telegram_handle'> | null;
  // The handle is not readable from the table; your own comes from get_telegram_handles.
  const author: CreateAuthor | null = row
    ? { ...row, telegram_handle: (await fetchTelegramHandles([row.id])).get(row.id) ?? null }
    : null;
  return { subjects: (subjectsRes.data ?? []) as Subject[], author };
}

export async function createBarterPost(post: NewBarterPost): Promise<void> {
  const { error } = await supabase.from('barter_posts').insert([post]);
  if (error) throw new Error(`Database error: ${error.message}`);
}
