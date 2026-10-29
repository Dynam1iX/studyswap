'use client';

import { TaskFiles } from '@/components/files/TaskFiles';
import { useId, useState, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { useMyId } from '@/lib/auth';
import { CalendarDays, ChevronRight, Mail, Send, Tag, X } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { paletteFor } from '@/lib/categoryPalette';
import { getAuthorName, getContactHref, getContactMethod, type FeedPost } from '@/lib/feed';
import { formatPostedAt, formatStudyInfo, getInitials } from '@/lib/format';
import type { Subject } from '@/types/database';
import { ExchangeIcon } from '@/components/ui/ExchangeIcon';
import { ShareCardButton } from '@/components/feed/ShareCardButton';
import { StudentLink } from '@/components/student/StudentLink';
import { ViewableAvatar } from '@/components/ui/AvatarViewer';
import { useAvatarUrl } from '@/lib/avatar';
import { useT } from '@/i18n';
import { useI18n } from '@/i18n';

interface SwapDetailModalProps {
  /** The card to show, or null when the modal is closed. */
  post: FeedPost | null;
  onClose: () => void;
  /** false on the author's own page. */
  linkAuthor?: boolean;
}

/** "More info" for a barter card: full texts, subjects, author and contact. */
export function SwapDetailModal({ post, onClose, linkAuthor = true }: SwapDetailModalProps) {
  const t = useT();
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
      size="lg"
      header={
        <div className="flex items-center justify-between px-6 py-2">
          <h2 id={titleId} className="font-bricolage text-[22px] font-extrabold text-ink">
            {t.details.title}
          </h2>
          <div className="flex items-center gap-2">
          {data && <ShareCardButton card={data} />}
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-soft text-ink transition hover:bg-line focus-visible:outline-2 focus-visible:outline-brand-from"
          >
            <X className="size-5" strokeWidth={2.4} />
          </button>
          </div>
        </div>
      }
      footer={data && <SwapDetailActions post={data} onClose={onClose} />}
    >
      {data && <SwapDetailBody post={data} onClose={onClose} linkAuthor={linkAuthor} />}
    </BottomSheet>
  );
}

/** Avatar (opens the photo) and name with "Profile ›" (opens the author's page). */
function AuthorRow({ post, onClose, linkAuthor }: { post: FeedPost; onClose: () => void; linkAuthor: boolean }) {
  const t = useT();
  const authorName = getAuthorName(post);
  const subtitle = formatStudyInfo(t, post.author?.major, post.author?.study_year);
  const url = useAvatarUrl(post.author?.avatar_path);
  const avatar = (
    <ViewableAvatar url={url} name={authorName} subtitle={subtitle}>
      <span data-student-avatar className="flex shrink-0 rounded-full">
        <UserAvatar initials={getInitials(authorName)} path={post.author?.avatar_path} className="size-12 text-base font-bold" />
      </span>
    </ViewableAvatar>
  );
  const text = (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="truncate text-[17px] font-bold text-ink">{authorName}</span>
      <span className="text-[13px] font-medium break-words text-muted">{subtitle}</span>
    </span>
  );

  if (!post.author || !linkAuthor) {
    return (
      <div className="flex items-center gap-3">
        {avatar}
        {text}
      </div>
    );
  }
  return (
    <div className="-mx-2 flex items-center gap-1 rounded-2xl p-2 transition-colors has-[a:hover]:bg-soft">
      {avatar}
      <StudentLink
        author={post.author}
        label={t.student.open(authorName)}
        onNavigate={onClose}
        className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl py-1 pl-2 transition active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-brand-from"
      >
        {text}
        <span className="flex shrink-0 items-center gap-0.5 text-[13px] font-semibold text-brand-ink">
          {t.student.profile}
          <ChevronRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.4} />
        </span>
      </StudentLink>
    </div>
  );
}

function SwapDetailBody({ post, onClose, linkAuthor }: { post: FeedPost; onClose: () => void; linkAuthor: boolean }) {
  const { t, locale } = useI18n();
  const authorName = getAuthorName(post);
  const subjects = [post.offered, post.needed].filter((s): s is Subject => s !== null);
  const departments = [...new Set(subjects.map((s) => s.department).filter(Boolean))];

  return (
    <div className="flex flex-col gap-4 px-6 pt-2 pb-10">
      {/* Author */}
      <AuthorRow post={post} onClose={onClose} linkAuthor={linkAuthor} />

      {/* Can teach ⇄ Needs help */}
      <div className="relative grid grid-cols-2 gap-6">
        <SwapHalf label={t.card.canTeach} subject={post.offered} />
        <SwapHalf label={t.card.needsHelp} subject={post.needed} />
        {/* Card-coloured disc behind the icon so no subject colour shows at its edge */}
        <span className="pointer-events-none absolute top-1/2 left-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface">
          <ExchangeIcon className="size-10" />
        </span>
      </div>

      <TextBlock title={t.details.whatTheyTeach} text={post.offered_description} />
      <TextBlock title={t.details.whatTheyNeed} text={post.description} />
      <TaskFiles files={post.files} />

      {/* Subjects */}
      <section className="flex flex-col gap-2">
        <h3 className="font-bricolage text-[17px] font-bold text-ink">{t.details.subjects}</h3>
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
                  {t.categories[subject.category]}
                </Chip>
              </li>,
            ];
          })}
          {departments.map((department) => (
            <li key={department}>
              <Chip className="border border-line-strong bg-surface text-muted">{department}</Chip>
            </li>
          ))}
        </ul>
      </section>

      {/* Details */}
      <dl className="flex flex-col gap-3 rounded-2xl bg-soft px-4 py-3.5">
        <DetailRow icon={<CalendarDays className="size-5" />} label={t.details.posted}>
          {formatPostedAt(post.created_at, locale)}
        </DetailRow>
        <DetailRow
          icon={getContactMethod(post) === 'telegram' ? <Send className="size-5" /> : <Mail className="size-5" />}
          label={t.details.contactVia}
        >
          {post.contact?.method === 'telegram' ? `Telegram · @${post.contact.value}` : t.details.universityEmail}
        </DetailRow>
        <DetailRow icon={<Tag className="size-5" />} label={t.details.status} valueClassName="text-success">
          {t.details.statusOpen}
        </DetailRow>
      </dl>
    </div>
  );
}

function SwapHalf({ label, subject }: { label: string; subject: Subject | null }) {
  const t = useT();
  const palette = paletteFor(subject?.category);
  return (
    <div style={{ backgroundColor: palette.bg }} className="flex min-w-0 flex-col items-start gap-2 rounded-2xl p-4">
      <span style={{ color: palette.label }} className="text-[10px] font-semibold tracking-[0.8px] uppercase">
        {label}
      </span>
      <span style={{ color: palette.title }} className="w-full text-[18px] leading-[22px] font-bold break-words">
        {subject?.name ?? t.details.notSpecified}
      </span>
      {subject && (
        <Chip style={{ color: palette.title }} className="bg-surface/70">
          {subject.code}
        </Chip>
      )}
    </div>
  );
}

function TextBlock({ title, text }: { title: string; text: string }) {
  const t = useT();
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-bricolage text-[17px] font-bold text-ink">{title}</h3>
      <p
        className={`text-[15px] leading-[23px] font-medium break-words whitespace-pre-line ${
          text.trim() ? 'text-ink' : 'text-muted'
        }`}
      >
        {text.trim() || t.details.noDetails}
      </p>
    </section>
  );
}

function Chip({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <span
      style={style}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold ${className}`}
    >
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
  const t = useT();
  const myId = useMyId();
  const isTelegram = getContactMethod(post) === 'telegram';
  const own = Boolean(myId) && post.author?.id === myId;
  return (
    <div className="grid shrink-0 grid-cols-4 gap-6 border-t border-line bg-surface px-6 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
      <button
        type="button"
        onClick={onClose}
        className="col-span-1 h-14 cursor-pointer rounded-2xl border-[1.5px] border-line-strong bg-surface text-base font-bold text-ink transition hover:bg-soft"
      >
        {t.common.close}
      </button>
      {own ? (
        <Link
          href="/profile"
          onClick={onClose}
          className="col-span-3 flex h-14 items-center justify-center gap-2 rounded-2xl bg-soft text-[15px] font-bold text-muted no-underline transition hover:text-ink"
        >
          {t.card.yourCard} · {t.card.manageInProfile}
        </Link>
      ) : (
        <a
          href={getContactHref(post)}
          target={isTelegram ? '_blank' : undefined}
          rel="noreferrer"
          // No contact known yet: shown, but not a link.
          aria-disabled={post.contact ? undefined : true}
          className="col-span-3 flex h-14 aria-disabled:pointer-events-none aria-disabled:opacity-60 items-center justify-center gap-2.5 rounded-2xl bg-linear-to-r from-brand-fill-from to-brand-fill-to text-base font-bold text-white no-underline shadow-[0_8px_20px_rgba(200,40,140,0.28)] transition hover:opacity-95 active:scale-[0.99]"
        >
          <img
            src={isTelegram ? '/telegram.svg' : '/email.svg'}
            alt=""
            className={isTelegram ? 'size-6' : 'size-[22px]'}
          />
          {t.card.contact[isTelegram ? 'telegram' : 'email']}
        </a>
      )}
    </div>
  );
}
