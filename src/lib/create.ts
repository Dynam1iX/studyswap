import { fetchMyProfileRow } from '@/lib/profile';
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
  const [subjectsRes, me] = await Promise.all([
    supabase.from('subjects').select('*').order('name', { ascending: true }),
    fetchMyProfileRow(),
  ]);
  const author: CreateAuthor | null = me
    ? {
        id: me.id,
        full_name: me.full_name,
        major: me.major,
        study_year: me.study_year,
        avatar_path: me.avatar_path,
        telegram_handle: me.telegram_handle,
      }
    : null;
  if (subjectsRes.error) throw subjectsRes.error;
  return { subjects: (subjectsRes.data ?? []) as Subject[], author };
}

export async function createBarterPost(post: NewBarterPost): Promise<void> {
  const { error } = await supabase.from('barter_posts').insert([post]);
  if (error) throw error;
}
