import type { Category } from '@/types/database';

/** What a card's link preview shows (get_card_preview: public, no contacts or photos). */
export interface CardPreview {
  code: string;
  needed_name: string;
  needed_category: Category;
  needed_topic: string;
  offered_name: string;
  offered_category: Category;
  offered_topic: string;
  author_name: string;
  major: string | null;
  study_year: number | null;
}

/**
 * Server side: asks Supabase for the preview of an active card without signing in
 * (chat apps fetch link previews anonymously). null when there is no such active card.
 */
export async function fetchCardPreview(code: string): Promise<CardPreview | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/rpc/get_card_preview`, {
      method: 'POST',
      // apikey only: works with both the legacy anon key and a publishable key.
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_code: code }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as CardPreview[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}
