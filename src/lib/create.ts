import { fetchMyProfileRow } from '@/lib/profile';
import { attachFiles, type PreparedFile } from '@/lib/cardFiles';
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

/**
 * Creates the card and attaches the example-task files. If the files cannot be uploaded,
 * the card is deleted again, so a half-made card never shows up in the Feed.
 */
export async function createBarterPost(post: NewBarterPost, files: PreparedFile[] = []): Promise<void> {
  const { data, error } = await supabase.from('barter_posts').insert([post]).select('id').single();
  if (error) throw error;
  if (files.length === 0) return;
  try {
    await attachFiles(post.author_id, data.id as string, files);
  } catch (err: unknown) {
    await supabase.rpc('delete_my_card', { p_id: data.id });
    throw new FilesUploadError(err);
  }
}

/** The card was not published because its files could not be uploaded. */
export class FilesUploadError extends Error {
  constructor(cause: unknown) {
    super('Could not upload the files', { cause });
  }
}
