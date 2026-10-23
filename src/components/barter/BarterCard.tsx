'use client';

import { useState } from 'react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useReplay } from '@/lib/useReplay';
import type { CategoryPalette } from '@/lib/categoryPalette';
import type { ContactMethod } from '@/types/database';
import { ExchangeIcon } from '@/components/ui/ExchangeIcon';
import { useT } from '@/i18n';

export interface CardAuthor {
  initials: string;
  /** Profile photo, or null/undefined for initials. */
  avatarUrl?: string | null;
  name: string;
  /** "Software Engineering, Year 1" */
  subtitle: string;
}

export interface CardHalf {
  palette: CategoryPalette;
  title: string;
  topic: string;
}

interface BarterCardProps {
  author: CardAuthor;
  needs: CardHalf;
  teaches: CardHalf;
  contactMethod: ContactMethod;
  /** Link for the contact button. Omit it to render the card as a non-clickable preview. */
  contactHref?: string;
  liked?: boolean;
  /** Omit it for a static heart (preview). */
  onToggleLike?: () => void;
  /** Makes the whole card clickable, e.g. to open the details modal. */
  onOpen?: () => void;
  /** Accessible name of the open action. */
  openLabel?: string;
}

function SubjectHalf({ label, half }: { label: string; half: CardHalf }) {
  // Count subject changes after the first render, so only a change "blinks" (Create preview).
  const [lastTitle, setLastTitle] = useState(half.title);
  const [changes, setChanges] = useState(0);
  if (half.title !== lastTitle) {
    setLastTitle(half.title);
    setChanges((n) => n + 1);
  }

  return (
    <div
      style={{ backgroundColor: half.palette.bg }}
      className="flex min-h-[83px] w-full flex-col justify-between rounded-xl p-3 transition-colors duration-500"
    >
      <span
        style={{ color: half.palette.label }}
        className="block text-[10px] font-semibold tracking-wider uppercase transition-colors duration-500"
      >
        {label}
      </span>
      <span
        key={changes}
        style={{ color: half.palette.title }}
        className={`block truncate pr-8 text-[18px] leading-tight font-semibold transition-colors duration-500 ${
          changes > 0 ? 'animate-rise motion-reduce:animate-none' : ''
        }`}
      >
        {half.title}
      </span>
      <span
        style={{ color: half.palette.topic }}
        className="block truncate text-[12px] font-medium transition-colors duration-500"
      >
        {half.topic}
      </span>
    </div>
  );
}

const CONTACT_ICON = {
  telegram: { icon: '/telegram.svg', alt: 'Telegram' },
  email: { icon: '/email.svg', alt: 'Email' },
} as const satisfies Record<ContactMethod, { icon: string; alt: string }>;

const contactClasses =
  'flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand-from to-brand-to text-[15px] font-semibold text-white no-underline';

/** The "Needs help / Can teach" card used in the Feed and in the Create preview. */
export function BarterCard({
  author,
  needs,
  teaches,
  contactMethod,
  contactHref,
  liked = false,
  onToggleLike,
  onOpen,
  openLabel,
}: BarterCardProps) {
  const t = useT();
  // With onOpen, a full-size button sits under the content. Content ignores clicks
  // so they reach that button; the heart and the contact link stay clickable on top.
  const layer = onOpen ? 'pointer-events-none relative' : '';
  const [bursting, burst] = useReplay(600);
  const [pops, setPops] = useState(0);
  const interactive = onOpen ? 'pointer-events-auto relative z-10' : '';

  const contact = { ...CONTACT_ICON[contactMethod], label: t.card.contact[contactMethod] };
  const contactContent = (
    <>
      <img src={contact.icon} alt={contact.alt} className="size-[22px]" />
      <span>{contact.label}</span>
    </>
  );

  return (
    <div
      className={`group relative w-full space-y-2.5 rounded-2xl border border-line bg-surface p-4 shadow-sm transition-[transform,box-shadow] duration-300 ease-out ${
        onOpen ? 'hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(60,30,110,0.10)] active:scale-[0.98]' : ''
      }`}
    >
      {onOpen && (
        <button
          type="button"
          onClick={onOpen}
          aria-label={openLabel ?? t.card.openDetails}
          aria-haspopup="dialog"
          className="absolute inset-0 cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-from"
        />
      )}

      {/* Author and wishlist */}
      <div className={`flex items-center justify-between ${layer}`}>
        <div className="flex min-w-0 items-center gap-2.5">
          <UserAvatar initials={author.initials} url={author.avatarUrl ?? null} className="size-10 text-xs" />
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-[15px] font-semibold text-ink">{author.name}</span>
            <span className="truncate text-[13px] font-medium text-muted">{author.subtitle}</span>
          </div>
        </div>

        {onToggleLike ? (
          <button
            type="button"
            onClick={() => {
              // Liking pops the heart and bursts bubbles; unliking only shrinks it (active:scale).
              if (!liked) burst();
              setPops((n) => n + 1);
              onToggleLike();
            }}
            aria-label={t.card.like}
            aria-pressed={liked}
            className={`bubbly-ring relative shrink-0 cursor-pointer p-1 transition hover:scale-110 active:scale-90 ${
              bursting ? 'bubbly-animate' : ''
            } ${interactive}`}
          >
            <img
              key={pops}
              src={liked ? '/liked.svg' : '/like.svg'}
              alt=""
              className={`relative size-[22px] ${liked ? '' : 'theme-icon'} ${pops > 0 && liked ? 'animate-heart-pop motion-reduce:animate-none' : ''}`}
            />
          </button>
        ) : (
          <span className="shrink-0 p-1">
            <img src="/like.svg" alt="" className="theme-icon size-[22px]" />
          </span>
        )}
      </div>

      {/* Subjects, with the exchange icon over the seam */}
      <div className={`relative flex w-full flex-col gap-2 ${onOpen ? 'pointer-events-none' : ''}`}>
        <SubjectHalf label={t.card.needsHelp} half={needs} />
        <SubjectHalf label={t.card.canTeach} half={teaches} />
        <ExchangeIcon
          label={t.card.exchange}
          className="pointer-events-none absolute top-1/2 right-[18px] z-10 block size-10 -translate-y-1/2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-180 group-active:rotate-180"
        />
      </div>

      {contactHref ? (
        <a
          href={contactHref}
          target={contactMethod === 'telegram' ? '_blank' : undefined}
          rel="noreferrer"
          className={`${contactClasses} shine shadow-[0_3px_12px_rgba(173,70,255,0.25)] transition hover:opacity-95 active:scale-[0.99] ${interactive}`}
        >
          {contactContent}
        </a>
      ) : (
        <div className={`${contactClasses} opacity-95 select-none`}>{contactContent}</div>
      )}
    </div>
  );
}
