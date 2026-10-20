'use client';

import { useId, useState, type CSSProperties, type ReactNode } from 'react';
import { CalendarDays, Mail, Send, Star, Tag, X } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { paletteFor } from '@/lib/categoryPalette';
import { getAuthorName, getContactHref, type FeedPost } from '@/lib/feed';
import { formatPostedAt, formatStudyInfo, getInitials } from '@/lib/format';
import type { Subject } from '@/types/database';

interface SwapDetailModalProps {
  /** The card to show, or null when the modal is closed. */
  post: FeedPost | null;
  onClose: () => void;
}

/** "More info" for a barter card: full texts, subjects, author and contact. */
export function SwapDetailModal({ post, onClose }: SwapDetailModalProps) {
  const titleId = useId();
  // Keep the last post on screen while the sheet animates out.
  const [lastPost, setLastPost] = useState(post);
  if (post && post !== lastPost) setLastPost(post);
  const data = post ?? lastPost;

  return (
    <BottomSheet
      open={post !== null}
      onClose={onClose}
      labelledBy={titleId}
      header={
        <div className="flex items-center justify-between px-6 py-2">
          <h2 id={titleId} className="font-bricolage text-[22px] font-extrabold text-ink">
            Swap details
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-soft text-ink transition hover:bg-line focus-visible:outline-2 focus-visible:outline-brand-from"
          >
            <X className="size-5" strokeWidth={2.4} />
          </button>
        </div>
      }
      footer={data && <SwapDetailActions post={data} onClose={onClose} />}
    >
      {data && <SwapDetailBody post={data} />}
    </BottomSheet>
  );
}

function SwapDetailBody({ post }: { post: FeedPost }) {
  const authorName = getAuthorName(post);
  const subjects = [post.offered, post.needed].filter((s): s is Subject => s !== null);
  const departments = [...new Set(subjects.map((s) => s.department).filter(Boolean))];

  return (
    <div className="flex flex-col gap-4 px-6 pt-2 pb-10">
      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#F1E9FF] text-base font-bold text-[#6D1FC4]">
          {getInitials(authorName)}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[17px] font-bold text-ink">{authorName}</span>
          <span className="text-[13px] font-medium break-words text-muted">
            {formatStudyInfo(post.author?.major, post.author?.study_year)}
          </span>
        </div>
        {/* There is no ratings table yet. */}
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-soft px-3 py-[7px] text-xs font-semibold text-muted">
          <Star aria-hidden className="size-4" />
          No ratings yet
        </span>
      </div>

      {/* Can teach ⇄ Needs help */}
      <div className="relative grid grid-cols-2 gap-6">
        <SwapHalf label="Can teach" subject={post.offered} />
        <SwapHalf label="Needs help" subject={post.needed} />
        <img
          src="/exchangeicon.svg"
          alt=""
          className="pointer-events-none absolute top-1/2 left-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-white"
        />
      </div>

      <TextBlock title="What they can teach" text={post.offered_description} />
      <TextBlock title="What they need help with" text={post.description} />

      {/* Subjects */}
      <section className="flex flex-col gap-2">
        <h3 className="font-bricolage text-[17px] font-bold text-ink">Subjects</h3>
        <ul className="flex flex-wrap gap-2">
          {subjects.map((subject) => {
            const palette = paletteFor(subject.category);
            return [
              <li key={`${subject.id}-name`}>
                <Chip style={{ backgroundColor: palette.bg, color: palette.title }}>
                  {subject.code} · {subject.name}
                </Chip>
              </li>,
              <li key={`${subject.id}-category`}>
                <Chip className="bg-soft text-ink">
                  <span aria-hidden style={{ backgroundColor: palette.dot }} className="size-2 rounded-full" />
                  {subject.category}
                </Chip>
              </li>,
            ];
          })}
          {departments.map((department) => (
            <li key={department}>
              <Chip className="border border-line-strong bg-white text-muted">{department}</Chip>
            </li>
          ))}
        </ul>
      </section>

      {/* Details */}
      <dl className="flex flex-col gap-3 rounded-2xl bg-soft px-4 py-3.5">
        <DetailRow icon={<CalendarDays className="size-5" />} label="Posted">
          {formatPostedAt(post.created_at)}
        </DetailRow>
        <DetailRow
          icon={post.contact_method === 'telegram' ? <Send className="size-5" /> : <Mail className="size-5" />}
          label="Contact via"
        >
          {post.contact_method === 'telegram' && post.author?.telegram_handle
            ? `Telegram · @${post.author.telegram_handle}`
            : post.contact_method === 'telegram'
              ? 'Telegram'
              : 'University email'}
        </DetailRow>
        <DetailRow icon={<Tag className="size-5" />} label="Status" valueClassName="text-success">
          Active · open for swaps
        </DetailRow>
      </dl>
    </div>
  );
}

function SwapHalf({ label, subject }: { label: string; subject: Subject | null }) {
  const palette = paletteFor(subject?.category);
  return (
    <div style={{ backgroundColor: palette.bg }} className="flex min-w-0 flex-col items-start gap-2 rounded-2xl p-4">
      <span style={{ color: palette.label }} className="text-[10px] font-semibold tracking-[0.8px] uppercase">
        {label}
      </span>
      <span style={{ color: palette.title }} className="w-full text-[18px] leading-[22px] font-bold break-words">
        {subject?.name ?? 'Not specified'}
      </span>
      {subject && (
        <Chip style={{ color: palette.title }} className="bg-white/70">
          {subject.code}
        </Chip>
      )}
    </div>
  );
}

function TextBlock({ title, text }: { title: string; text: string }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-bricolage text-[17px] font-bold text-ink">{title}</h3>
      <p
        className={`text-[15px] leading-[23px] font-medium break-words whitespace-pre-line ${
          text.trim() ? 'text-[#3B3552]' : 'text-muted'
        }`}
      >
        {text.trim() || 'No details yet.'}
      </p>
    </section>
  );
}

function Chip({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <span style={style} className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold ${className}`}>
      {children}
    </span>
  );
}

function DetailRow({
  icon,
  label,
  children,
  valueClassName = 'text-ink',
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex shrink-0 items-center gap-2.5 text-[13px] font-semibold text-muted">
        <span aria-hidden>{icon}</span>
        {label}
      </dt>
      <dd className={`min-w-0 text-right text-sm font-semibold break-words ${valueClassName}`}>{children}</dd>
    </div>
  );
}

function SwapDetailActions({ post, onClose }: { post: FeedPost; onClose: () => void }) {
  const isTelegram = post.contact_method === 'telegram';
  return (
    <div className="grid shrink-0 grid-cols-4 gap-6 border-t border-line bg-white px-6 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
      <button
        type="button"
        onClick={onClose}
        className="col-span-1 h-14 cursor-pointer rounded-2xl border-[1.5px] border-line-strong bg-white text-base font-bold text-ink transition hover:bg-soft"
      >
        Close
      </button>
      <a
        href={getContactHref(post)}
        target={isTelegram ? '_blank' : undefined}
        rel="noreferrer"
        className="col-span-3 flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-linear-to-r from-brand-from to-brand-to text-base font-bold text-white no-underline shadow-[0_8px_20px_rgba(200,40,140,0.28)] transition hover:opacity-95 active:scale-[0.99]"
      >
        <img src={isTelegram ? '/telegram.svg' : '/email.svg'} alt="" className={isTelegram ? 'size-6' : 'size-[22px]'} />
        {isTelegram ? 'Message on Telegram' : 'Send an Email'}
      </a>
    </div>
  );
}
