'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { messages } from '@/i18n';
import { supabase } from '@/lib/supabase';
import type { Category, ContactMethod } from '@/types/database';

export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';
export type RequestDirection = 'incoming' | 'outgoing';

/** One row of get_my_requests(). */
export interface SwapRequestItem {
  id: string;
  direction: RequestDirection;
  status: RequestStatus;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  /** Counts on the bell: a new request on my card, or an answer to mine I have not seen. */
  unseen: boolean;
  postId: string;
  needed: { name: string; category: Category };
  offered: { name: string; category: Category };
  other: { id: string; name: string; major: string | null; year: number | null; avatarPath: string | null };
  /** Filled once the request is accepted (Telegram if linked, otherwise e-mail). */
  contact: { method: ContactMethod; value: string } | null;
}

interface Row {
  id: string;
  direction: RequestDirection;
  status: RequestStatus;
  message: string | null;
  created_at: string;
  updated_at: string;
  unseen: boolean;
  post_id: string;
  needed_name: string;
  needed_category: Category;
  offered_name: string;
  offered_category: Category;
  other_id: string;
  other_name: string;
  other_major: string | null;
  other_year: number | null;
  other_avatar: string | null;
  contact_method: ContactMethod | null;
  contact: string | null;
}

function fromRow(row: Row): SwapRequestItem {
  return {
    id: row.id,
    direction: row.direction,
    status: row.status,
    message: row.message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    unseen: row.unseen,
    postId: row.post_id,
    needed: { name: row.needed_name, category: row.needed_category },
    offered: { name: row.offered_name, category: row.offered_category },
    other: {
      id: row.other_id,
      name: row.other_name,
      major: row.other_major,
      year: row.other_year,
      avatarPath: row.other_avatar,
    },
    contact:
      row.contact_method && row.contact ? { method: row.contact_method, value: row.contact.replace(/^@/, '') } : null,
  };
}

// ---------------------------------------------------------------------------
// Shared store: the bell, the Requests page and the cards read the same list
// ---------------------------------------------------------------------------

interface RequestsState {
  /** null until the first load. */
  items: SwapRequestItem[] | null;
  /** The signed-in student's id, to hide "Propose a swap" on their own cards. */
  myId: string | null;
}

let state: RequestsState = { items: null, myId: null };
const listeners = new Set<() => void>();
let loading: Promise<void> | null = null;

function emit(next: Partial<RequestsState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

/** Reloads the list (deduplicated while a load is running). */
export function refreshRequests(): Promise<void> {
  if (loading) return loading;
  loading = (async () => {
    try {
      const [{ data: session }, { data, error }] = await Promise.all([
        supabase.auth.getSession(),
        supabase.rpc('get_my_requests'),
      ]);
      if (error) throw error;
      emit({ items: ((data ?? []) as Row[]).map(fromRow), myId: session.session?.user.id ?? null });
    } catch (err: unknown) {
      console.error('Could not load swap requests:', err);
    } finally {
      loading = null;
    }
  })();
  return loading;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const SERVER_STATE: RequestsState = { items: null, myId: null };

/** Refresh every minute while the app is open. */
const REFRESH_MS = 60_000;

/** The shared list, without starting any loading (cards use this). */
export function useRequestsSnapshot(): RequestsState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  );
}

/**
 * The student's requests, kept fresh: loaded once, again when the app comes back to
 * the foreground, and every minute. Used by the bell (on every signed-in page).
 */
export function useRequests(): RequestsState {
  const snapshot = useRequestsSnapshot();

  useEffect(() => {
    if (state.items === null) void refreshRequests();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refreshRequests();
    };
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refreshRequests();
    }, REFRESH_MS);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return snapshot;
}

/** My latest request for a card, if any (to show "sent" on the card). */
export function myRequestFor(items: SwapRequestItem[] | null, postId: string): SwapRequestItem | null {
  return items?.find((item) => item.direction === 'outgoing' && item.postId === postId) ?? null;
}

/** Requests that block sending another one for the same card. */
export function isOpenRequest(item: SwapRequestItem | null): boolean {
  return item !== null && (item.status === 'pending' || item.status === 'accepted' || item.status === 'completed');
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/** Database messages in the interface language. */
function friendly(message: string): string {
  const t = messages().requests.errors;
  if (/no longer available/i.test(message)) return t.notAvailable;
  if (/own card/i.test(message)) return t.ownCard;
  if (/already sent/i.test(message)) return t.already;
  if (/too long/i.test(message)) return t.tooLong;
  if (/cannot be (cancelled|answered|completed)/i.test(message)) return t.cannotChange;
  return message || messages().common.somethingWrong;
}

async function call(fn: string, args?: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.rpc(fn, args);
  if (error) {
    // The list may be out of date (e.g. the other student already answered).
    void refreshRequests();
    throw new Error(friendly(error.message));
  }
  await refreshRequests();
}

export const sendSwapRequest = (postId: string, message: string) =>
  call('send_swap_request', { p_post_id: postId, p_message: message.trim() });
export const cancelSwapRequest = (id: string) => call('cancel_swap_request', { p_id: id });
export const respondSwapRequest = (id: string, accept: boolean) =>
  call('respond_swap_request', { p_id: id, p_accept: accept });
export const completeSwap = (id: string) => call('complete_swap', { p_id: id });

/** The sender has looked at the answers: clears them from the bell. */
export async function markRequestsSeen(): Promise<void> {
  if (!state.items?.some((item) => item.direction === 'outgoing' && item.unseen)) return;
  // Clear the dots at once; the database follows.
  emit({
    items: state.items.map((item) => (item.direction === 'outgoing' ? { ...item, unseen: false } : item)),
  });
  const { error } = await supabase.rpc('mark_requests_seen');
  if (error) console.error('Could not mark requests as seen:', error);
}

/** Message length limit (matches the database). */
export const REQUEST_MESSAGE_MAX = 200;
