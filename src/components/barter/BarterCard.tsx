import type { CategoryPalette } from '@/lib/categoryPalette';
import type { ContactMethod } from '@/types/database';

export interface CardAuthor {
  initials: string;
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
  return (
    <div
      style={{ backgroundColor: half.palette.bg }}
      className="flex min-h-[83px] w-full flex-col justify-between rounded-xl p-3"
    >
      <span style={{ color: half.palette.label }} className="block text-[10px] font-semibold tracking-wider uppercase">
        {label}
      </span>
      <span style={{ color: half.palette.title }} className="block truncate pr-8 text-[18px] leading-tight font-semibold">
        {half.title}
      </span>
      <span style={{ color: half.palette.topic }} className="block truncate text-[12px] font-medium">
        {half.topic}
      </span>
    </div>
  );
}

const CONTACT = {
  telegram: { icon: '/telegram.svg', alt: 'Telegram', label: 'Message on Telegram' },
  email: { icon: '/email.svg', alt: 'Email', label: 'Send an Email' },
} as const satisfies Record<ContactMethod, { icon: string; alt: string; label: string }>;

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
  openLabel = 'Show swap details',
}: BarterCardProps) {
  // With onOpen, a full-size button sits under the content. Content ignores clicks
  // so they reach that button; the heart and the contact link stay clickable on top.
  const layer = onOpen ? 'pointer-events-none relative' : '';
  const interactive = onOpen ? 'pointer-events-auto relative z-10' : '';

  const contact = CONTACT[contactMethod];
  const contactContent = (
    <>
      <img src={contact.icon} alt={contact.alt} className="size-[22px]" />
      <span>{contact.label}</span>
    </>
  );

  return (
    <div
      className={`relative w-full space-y-2.5 rounded-2xl border border-line bg-white p-4 shadow-sm transition ${
        onOpen ? 'hover:shadow-md' : ''
      }`}
    >
      {onOpen && (
        <button
          type="button"
          onClick={onOpen}
          aria-label={openLabel}
          aria-haspopup="dialog"
          className="absolute inset-0 cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-from"
        />
      )}

      {/* Author and wishlist */}
      <div className={`flex items-center justify-between ${layer}`}>
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F1E9FF] text-xs font-semibold text-[#6D1FC4]">
            {author.initials}
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-[15px] font-semibold text-ink">{author.name}</span>
            <span className="truncate text-[13px] font-medium text-muted">{author.subtitle}</span>
          </div>
        </div>

        {onToggleLike ? (
          <button
            type="button"
            onClick={onToggleLike}
            aria-label="Wishlist toggle"
            aria-pressed={liked}
            className={`shrink-0 cursor-pointer p-1 transition hover:scale-110 active:scale-95 ${interactive}`}
          >
            <img src={liked ? '/liked.svg' : '/like.svg'} alt="Like" className="size-[22px]" />
          </button>
        ) : (
          <span className="shrink-0 p-1">
            <img src="/like.svg" alt="Like" className="size-[22px]" />
          </span>
        )}
      </div>

      {/* Subjects, with the exchange icon over the seam */}
      <div className={`relative flex w-full flex-col gap-2 ${onOpen ? 'pointer-events-none' : ''}`}>
        <SubjectHalf label="Needs help" half={needs} />
        <SubjectHalf label="Can teach" half={teaches} />
        <img
          src="/exchangeicon.svg"
          alt="Exchange"
          className="pointer-events-none absolute top-1/2 right-[18px] z-10 block size-10 -translate-y-1/2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
        />
      </div>

      {contactHref ? (
        <a
          href={contactHref}
          target={contactMethod === 'telegram' ? '_blank' : undefined}
          rel="noreferrer"
          className={`${contactClasses} shadow-[0_3px_12px_rgba(173,70,255,0.25)] transition hover:opacity-95 active:scale-[0.99] ${interactive}`}
        >
          {contactContent}
        </a>
      ) : (
        <div className={`${contactClasses} opacity-95 select-none`}>{contactContent}</div>
      )}
    </div>
  );
}
