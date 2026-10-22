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
