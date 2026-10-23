'use client';

import { useId, useState } from 'react';
import { Loader2, Send, X } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ExchangeIcon } from '@/components/ui/ExchangeIcon';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useT } from '@/i18n';
import { paletteFor } from '@/lib/categoryPalette';
import { getAuthorName, type FeedPost } from '@/lib/feed';
import { formatStudyInfo, getInitials } from '@/lib/format';
import { REQUEST_MESSAGE_MAX, sendSwapRequest } from '@/lib/requests';
import { useReplay } from '@/lib/useReplay';
import type { Subject } from '@/types/database';

/** How long "Request sent!" stays before the sheet closes. */
const SENT_MS = 1300;

interface RequestSheetProps {
  /** The card to propose a swap for, or null when closed. */
  post: FeedPost | null;
  onClose: () => void;
}

/** "Propose a swap": the card in short, an optional message, Send. */
export function RequestSheet({ post, onClose }: RequestSheetProps) {
  const t = useT();
  const titleId = useId();
  // Keep the last card on screen while the sheet animates out; a fresh form each opening.
  const [lastPost, setLastPost] = useState(post);
  const [session, setSession] = useState(0);
  if (post && post !== lastPost) {
    setLastPost(post);
    setSession((n) => n + 1);
  }
  const data = post ?? lastPost;

  return (
    <BottomSheet
      open={post !== null}
      onClose={onClose}
      labelledBy={titleId}
      header={
        <div className="flex items-center justify-between px-6 py-2">
          <h2 id={titleId} className="font-bricolage text-[22px] font-extrabold text-ink">
            {t.requests.propose}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-soft text-ink transition hover:bg-line focus-visible:outline-2 focus-visible:outline-brand-from"
          >
            <X className="size-5" strokeWidth={2.4} />
          </button>
        </div>
      }
    >
      {data && <RequestForm key={`${data.id}-${session}`} post={data} onClose={onClose} />}
    </BottomSheet>
  );
}

function SubjectPill({ label, subject }: { label: string; subject: Subject | null }) {
  const palette = paletteFor(subject?.category);
  return (
    <div style={{ backgroundColor: palette.bg }} className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-2xl px-3.5 py-3">
      <span style={{ color: palette.label }} className="text-[10px] font-semibold tracking-[0.8px] uppercase">
        {label}
      </span>
      <span style={{ color: palette.title }} className="truncate text-[15px] font-bold">
        {subject?.name ?? '—'}
      </span>
    </div>
  );
}

function RequestForm({ post, onClose }: { post: FeedPost; onClose: () => void }) {
  const t = useT();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bubbling, bubble] = useReplay(700);
  const authorName = getAuthorName(post);

  const send = async () => {
    if (busy || sent) return;
    setBusy(true);
    setError(null);
    try {
      await sendSwapRequest(post.id, message);
      setSent(true);
      bubble();
      window.setTimeout(onClose, SENT_MS);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.common.somethingWrong);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 px-6 pt-2 pb-10">
      {/* Who and what */}
      <div className="flex items-center gap-3">
        <UserAvatar initials={getInitials(authorName)} path={post.author?.avatar_path} className="size-11 text-sm font-bold" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-base font-bold text-ink">{authorName}</span>
          <span className="truncate text-xs font-medium text-muted">
            {formatStudyInfo(t, post.author?.major, post.author?.study_year)}
          </span>
        </div>
      </div>

      <div className="relative flex gap-2">
        <SubjectPill label={t.requests.youTeach} subject={post.needed} />
        <SubjectPill label={t.requests.youLearn} subject={post.offered} />
        <span className="pointer-events-none absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface">
          <ExchangeIcon className="size-8" />
        </span>
      </div>

      {/* Optional message */}
      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] font-bold text-ink">
          {t.requests.message} <span className="font-semibold text-muted">{t.requests.optional}</span>
        </span>
        <span className="relative">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, REQUEST_MESSAGE_MAX))}
            rows={3}
            disabled={sent}
            placeholder={t.requests.messagePlaceholder}
            className="w-full resize-none rounded-[14px] border border-field bg-surface p-3 pb-7 text-[16px] leading-relaxed font-semibold text-ink outline-none transition placeholder:text-placeholder focus:border-brand-from sm:text-[14px]"
          />
          <span className="absolute right-3 bottom-2 text-[12px] font-semibold text-muted select-none">
            {message.length} / {REQUEST_MESSAGE_MAX}
          </span>
        </span>
      </label>

      <p className="text-xs font-medium text-muted">{t.requests.howItWorks}</p>

      {error && (
        <p className="animate-shake rounded-xl border border-danger-line bg-danger-soft p-3 text-xs font-semibold text-danger-ink">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => void send()}
        disabled={busy}
        className={`bubbly flex h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-brand-from to-brand-to text-[17px] font-bold text-white shadow-[0_8px_20px_rgba(200,40,140,0.28)] transition active:scale-[0.97] disabled:opacity-70 ${
          bubbling ? 'bubbly-animate' : ''
        }`}
      >
        {sent ? (
          <span className="flex items-center gap-2">
            <span className="tg-launch">
              <Send className="size-5" strokeWidth={2.4} />
            </span>
            {t.requests.sent}
          </span>
        ) : (
          <>
            {busy ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" strokeWidth={2.4} />}
            {t.requests.send}
          </>
        )}
      </button>
    </div>
  );
}
