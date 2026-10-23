import { supabase } from '@/lib/supabase';

/** Username of the StudySwap bot (without @). */
export const TELEGRAM_BOT = 'StudySwapAITU_bot';

/** Seconds a link works (matches the database). */
export const LINK_TTL_SECONDS = 600;

export type TelegramLinkStatus = 'pending' | 'linked' | 'no_username' | 'taken' | 'expired';

/** Starts a link: a one-time token for t.me/<bot>?start=<token>. */
export async function createTelegramLink(): Promise<string> {
  const { data, error } = await supabase.rpc('create_telegram_link');
  if (error) throw new Error(error.message);
  return data as string;
}

export function telegramLinkUrl(token: string): string {
  return `https://t.me/${TELEGRAM_BOT}?start=${token}`;
}

export async function fetchTelegramLinkStatus(token: string): Promise<TelegramLinkStatus> {
  const { data, error } = await supabase.rpc('get_telegram_link_status', { p_token: token });
  if (error) throw new Error(error.message);
  return data as TelegramLinkStatus;
}

/** The signed-in student's own handle (after linking). */
export async function fetchMyTelegramHandle(): Promise<string | null> {
  const { data: session } = await supabase.auth.getSession();
  const id = session.session?.user.id;
  if (!id) return null;
  const { data, error } = await supabase.rpc('get_telegram_handles', { p_ids: [id] });
  if (error) throw new Error(error.message);
  return ((data ?? []) as { telegram_handle: string }[])[0]?.telegram_handle ?? null;
}

export async function unlinkTelegram(): Promise<void> {
  const { error } = await supabase.rpc('unlink_my_telegram');
  if (error) throw new Error(error.message);
}
