import { CURRENT_USER_EMAIL } from '@/lib/currentUser';
import { getInitials, getShortName } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { PostStatus, StudyYear, Subject, User } from '@/types/database';

/** Interface languages. English is the default. */
export type Language = 'en' | 'ru' | 'kz';

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
  /** "Alzhan Y." */
  displayName: string;
  initials: string;
  major: string;
  studyYear: StudyYear;
  /** Without the leading "@"; null when the student has not linked Telegram. */
  telegramHandle: string | null;
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

type UserRow = Pick<User, 'id' | 'full_name' | 'telegram_handle' | 'major' | 'study_year'>;

interface PostRow {
  id: string;
  status: PostStatus;
  created_at: string;
  description: string | null;
  offered_description: string | null;
  needed: ProfileSubject | null;
  offered: ProfileSubject | null;
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
 * Loads everything the profile page shows.
 * Note: RLS only lets the public key read active posts, so completed and archived
 * cards stay hidden until the page reads as a signed-in user.
 */
export async function fetchProfile(email: string = CURRENT_USER_EMAIL): Promise<ProfileData | null> {
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, full_name, telegram_handle, major, study_year')
    .eq('email', email)
    .maybeSingle();

  if (userError) throw userError;
  const userRow = userData as UserRow | null;
  if (!userRow) return null;

  const { data: postData, error: postsError } = await supabase
    .from('barter_posts')
    .select(`
      id,
      status,
      created_at,
      description,
      offered_description,
      needed:subjects!barter_posts_needed_subject_id_fkey(id, code, name, category),
      offered:subjects!barter_posts_offered_subject_id_fkey(id, code, name, category)
    `)
    .eq('author_id', userRow.id)
    .order('created_at', { ascending: false });

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

  return {
    user: {
      id: userRow.id,
      fullName: userRow.full_name,
      displayName: getShortName(userRow.full_name),
      initials: getInitials(userRow.full_name),
      major: userRow.major || 'Software Engineering',
      studyYear: toStudyYear(userRow.study_year),
      telegramHandle: userRow.telegram_handle?.replace(/^@/, '') || null,
    },
    stats: {
      swapsDone: swapsDone ?? 0,
      activeCards: cards.filter((card) => card.status === 'active').length,
      rating: null,
    },
    // No user_subjects table yet, so both lists come from the student's own cards.
    needsHelp: uniqueSubjects(cards.map((card) => card.needed)),
    canTeach: uniqueSubjects(cards.map((card) => card.offered)),
    cards,
  };
}
