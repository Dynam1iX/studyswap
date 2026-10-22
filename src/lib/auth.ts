import { supabase } from '@/lib/supabase';
import type { DegreeLevel, StudyYear } from '@/types/database';

/** AITU student e-mail: the six-digit student id @astanait.edu.kz. */
export const STUDENT_EMAIL_RE = /^\d{6}@astanait\.edu\.kz$/i;

/** Length of the one-time code sent by e-mail (Supabase Auth → Email OTP Length). */
export const CODE_LENGTH = 6;

/** Seconds before "Resend code" can be used again. */
export const RESEND_SECONDS = 60;

/** Turns Supabase Auth errors into short messages for students. */
function friendly(error: { message?: string; status?: number } | null): Error {
  const message = error?.message ?? '';
  if (/rate limit|only request this after|too many/i.test(message)) {
    return new Error('Too many attempts. Wait a minute and try again.');
  }
  if (/expired|invalid/i.test(message)) return new Error('This code is wrong or has expired. Check it or ask for a new one.');
  if (/student e-mails|Database error saving new user/i.test(message)) {
    return new Error('Only AITU student e-mails (6 digits @astanait.edu.kz) can sign up.');
  }
  if (/fetch|network/i.test(message)) return new Error('No connection. Check the internet and try again.');
  return new Error(message || 'Something went wrong. Try again.');
}

/** E-mails a one-time code; creates the account on the first sign-in. */
export async function sendCode(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: true },
  });
  if (error) throw friendly(error);
}

/** Checks the code and signs the student in (the session is kept by supabase-js). */
export async function verifyCode(email: string, code: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code, type: 'email' });
  if (error) throw friendly(error);
}

/**
 * Sends the student to the Microsoft sign-in page (AITU accounts only: the Azure app
 * is single-tenant). Microsoft returns them to /login, where supabase-js picks up the session.
 */
export async function signInWithMicrosoft(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      scopes: 'openid email profile',
      redirectTo: `${window.location.origin}/login`,
    },
  });
  if (error) throw friendly(error);
}

/**
 * Error sent back by Microsoft or Supabase after a failed redirect sign-in (in the query
 * string or the #fragment). Removes it from the address bar so a reload does not show it again.
 */
export function takeRedirectError(): string | null {
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const code = params.get('error') ?? hash.get('error');
  if (!code) return null;
  const description = params.get('error_description') ?? hash.get('error_description') ?? '';
  window.history.replaceState(null, '', window.location.pathname);

  if (code === 'access_denied') return 'Microsoft sign-in was cancelled.';
  if (/student e-mails|Database error saving new user|email/i.test(description)) {
    return 'Only student accounts can sign in: 6 digits @astanait.edu.kz.';
  }
  return friendly({ message: description }).message;
}

/** First and last name from the Microsoft account, to fill in "Complete your profile". */
export async function nameFromAccount(): Promise<{ firstName: string; lastName: string } | null> {
  const { data } = await supabase.auth.getSession();
  const meta = (data.session?.user.user_metadata ?? {}) as Record<string, unknown>;
  const claims = (meta.custom_claims ?? {}) as Record<string, unknown>;
  const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

  const given = text(meta.given_name) || text(claims.given_name);
  const family = text(meta.family_name) || text(claims.family_name);
  if (given || family) return { firstName: given, lastName: family };

  const full = (text(meta.full_name) || text(meta.name)).split(/\s+/).filter(Boolean);
  if (full.length === 0) return null;
  return { firstName: full[0], lastName: full.slice(1).join(' ') };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/** E-mail of the signed-in student, or null. */
export async function currentEmail(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.email ?? null;
}

/** Whether the signed-in student already has a profile row (finished "Complete your profile"). */
export async function hasProfile(userId: string): Promise<boolean> {
  const { data, error } = await supabase.from('users').select('id').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data !== null;
}

export interface NewProfile {
  firstName: string;
  lastName: string;
  major: string;
  studyYear: StudyYear;
  degree: Extract<DegreeLevel, 'Undergraduate' | "Master's Degree">;
}

/** Creates the profile once; afterwards these details are read-only. */
export async function completeProfile(profile: NewProfile): Promise<void> {
  const { error } = await supabase.rpc('complete_my_profile', {
    p_full_name: `${profile.firstName.trim()} ${profile.lastName.trim()}`,
    p_major: profile.major,
    p_study_year: profile.studyYear,
    p_degree: profile.degree,
  });
  if (error) throw new Error(error.message);
}
