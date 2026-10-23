import { avatarUrl } from '@/lib/avatar';
import { fetchTelegramHandles } from '@/lib/feed';
import { currentEmail } from '@/lib/auth';
import { getInitials, getShortName } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { DegreeLevel, PostStatus, StudyYear, Subject, TelegramVisibility, User } from '@/types/database';
import type { Messages } from '@/i18n';

export type ProfileSubject = Pick<Subject, 'id' | 'code' | 'name' | 'category'>;

export interface ProfileCard {
  id: string;
  status: PostStatus;
  needed: ProfileSubject;
  offered: ProfileSubject;
  /** What the student needs help with (barter_posts.description). */
  neededTopic: string;
  /** What the student can teach (barter_posts.offered_description). */
  offeredTopic: string;
}

export interface ProfileUser {
  id: string;
  fullName: string;
  /** Split from full_name at the first space (the database keeps one field). */
  firstName: string;
  lastName: string;
  email: string;
  degree: DegreeLevel;
  /** "Alzhan Y." */
  displayName: string;
  initials: string;
  major: string;
  studyYear: StudyYear;
  /** Without the leading "@"; null when the student has not linked Telegram. */
  telegramHandle: string | null;
  telegramVisibility: TelegramVisibility;
  /** Storage path of the photo, or null. */
  avatarPath: string | null;
  /** Public URL of the photo, or null for initials. */
  avatarUrl: string | null;
}

export interface ProfileStats {
  swapsDone: number;
  activeCards: number;
  /** null until a ratings table exists. */
  rating: { average: number; count: number } | null;
}

export interface ProfileData {
  user: ProfileUser;
  stats: ProfileStats;
  needsHelp: ProfileSubject[];
  canTeach: ProfileSubject[];
  cards: ProfileCard[];
}

type UserRow = Pick<
  User,
  'id' | 'full_name' | 'email' | 'telegram_handle' | 'telegram_visibility' | 'major' | 'study_year' | 'degree_level' | 'avatar_path'
>;

/** A row of get_my_cards(). */
interface PostRow {
  id: string;
  status: PostStatus;
  created_at: string;
  description: string | null;
  offered_description: string | null;
  needed: ProfileSubject | null;
  offered: ProfileSubject | null;
}

/** "Alzhan Yerzhanuly" -> ["Alzhan", "Yerzhanuly"]; one word -> [word, ""]. */
function splitName(fullName: string): [string, string] {
  const trimmed = fullName.trim();
  const space = trimmed.indexOf(' ');
  return space === -1 ? [trimmed, ''] : [trimmed.slice(0, space), trimmed.slice(space + 1).trim()];
}

function toStudyYear(value: number | null | undefined): StudyYear {
  return value === 2 || value === 3 ? value : 1;
}

/** Unique subjects in the order they first appear. */
function uniqueSubjects(subjects: ProfileSubject[]): ProfileSubject[] {
  const seen = new Set<number>();
  return subjects.filter((subject) => {
    if (seen.has(subject.id)) return false;
    seen.add(subject.id);
    return true;
  });
}

/**
 * Loads everything the profile page shows. The student's own cards come from
 * get_my_cards(), which also returns inactive (archived) ones that RLS hides elsewhere.
 */
export async function fetchProfile(emailOverride?: string): Promise<ProfileData | null> {
  const email = emailOverride ?? (await currentEmail());
  if (!email) return null;
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, full_name, email, telegram_visibility, major, study_year, degree_level, avatar_path')
    .eq('email', email)
    .maybeSingle();

  if (userError) throw userError;
  const userRow = userData as UserRow | null;
  if (!userRow) return null;
  // The handle is not readable from the table (see get_telegram_handles); your own always is.
  userRow.telegram_handle = (await fetchTelegramHandles([userRow.id])).get(userRow.id) ?? null;

  const { data: postData, error: postsError } = await supabase.rpc('get_my_cards');

  if (postsError) throw postsError;

  const cards: ProfileCard[] = ((postData ?? []) as unknown as PostRow[]).flatMap((row) =>
    row.needed && row.offered
      ? [
          {
            id: row.id,
            status: row.status,
            needed: row.needed,
            offered: row.offered,
            neededTopic: row.description?.trim() ?? '',
            offeredTopic: row.offered_description?.trim() ?? '',
          },
        ]
      : [],
  );

  // A swap counts once it is accepted, whether the student sent it or received it on their post.
  const postIds = cards.map((card) => card.id);
  const swapFilter = postIds.length
    ? `sender_id.eq.${userRow.id},post_id.in.(${postIds.join(',')})`
    : `sender_id.eq.${userRow.id}`;

  const { count: swapsDone, error: swapsError } = await supabase
    .from('swap_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'accepted')
    .or(swapFilter);

  if (swapsError) throw swapsError;

  const [firstName, lastName] = splitName(userRow.full_name);
  // Inactive cards stay in My cards but do not count as subjects the student needs or teaches.
  const activeCards = cards.filter((card) => card.status === 'active');

  return {
    user: {
      id: userRow.id,
      fullName: userRow.full_name,
      firstName,
      lastName,
      email: userRow.email,
      degree: userRow.degree_level || 'Undergraduate',
      displayName: getShortName(userRow.full_name),
      initials: getInitials(userRow.full_name),
      major: userRow.major || 'Software Engineering',
      studyYear: toStudyYear(userRow.study_year),
      telegramHandle: userRow.telegram_handle?.replace(/^@/, '') || null,
      telegramVisibility: userRow.telegram_visibility === 'accepted' ? 'accepted' : 'everyone',
      avatarPath: userRow.avatar_path ?? null,
      avatarUrl: avatarUrl(userRow.avatar_path),
    },
    stats: {
      swapsDone: swapsDone ?? 0,
      activeCards: activeCards.length,
      rating: null,
    },
    // No user_subjects table yet, so both lists come from the student's own cards.
    needsHelp: uniqueSubjects(activeCards.map((card) => card.needed)),
    canTeach: uniqueSubjects(activeCards.map((card) => card.offered)),
    cards,
  };
}

// ---------------------------------------------------------------------------
// Changes (Supabase functions that act only on the current student)
// ---------------------------------------------------------------------------

/** "Bachelor's" / "Master's" / "PhD" for the degree_level values, in the interface language. */
export function degreeLabel(t: Messages, degree: DegreeLevel): string {
  return t.degree[degree] ?? t.degree.Undergraduate;
}

export async function updateMyCard(id: string, neededTopic: string, offeredTopic: string): Promise<void> {
  const { error } = await supabase.rpc('update_my_card', {
    p_id: id,
    p_description: neededTopic,
    p_offered_description: offeredTopic,
  });
  if (error) throw error;
}

export async function setMyCardStatus(id: string, status: 'active' | 'archived'): Promise<void> {
  const { error } = await supabase.rpc('set_my_card_status', { p_id: id, p_status: status });
  if (error) throw error;
}

export async function deleteMyCard(id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_my_card', { p_id: id });
  if (error) throw error;
}

export async function setTelegramVisibility(visibility: TelegramVisibility): Promise<void> {
  const { error } = await supabase.rpc('set_telegram_visibility', { p_visibility: visibility });
  if (error) throw error;
}

/** Everything stored about the student, saved as studyswap-my-data.json. */
export async function downloadMyData(): Promise<void> {
  const { data, error } = await supabase.rpc('export_my_data');
  if (error) throw error;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'studyswap-my-data.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Deletes the signed-in student for good: the photo file first (SQL cannot remove
 * Storage files), then everything in the database and the sign-in account.
 */
export async function deleteMyAccount(avatarPath: string | null): Promise<void> {
  if (avatarPath) await supabase.storage.from('avatars').remove([avatarPath]);
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
}
