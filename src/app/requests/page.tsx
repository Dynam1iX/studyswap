'use client';

import { Suspense, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, CheckCheck, Inbox, Loader2, Mail, Send, Undo2, X } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { MobileShell } from '@/components/layout/MobileShell';
import { ExchangeIcon } from '@/components/ui/ExchangeIcon';
import { Toast, useToast } from '@/components/ui/Toast';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useI18n, useT, type Messages } from '@/i18n';
import { paletteFor } from '@/lib/categoryPalette';
import { formatStudyInfo, getInitials } from '@/lib/format';
import {
  cancelSwapRequest,
  completeSwap,
  markRequestsSeen,
  respondSwapRequest,
  useRequests,
  type RequestStatus,
  type SwapRequestItem,
} from '@/lib/requests';
import type { Category } from '@/types/database';

type Tab = 'incoming' | 'sent';

const STATUS_STYLE: Record<RequestStatus, string> = {
  pending: 'bg-brand-soft text-brand-ink',
  accepted: 'bg-success-soft text-success',
  completed: 'bg-success-soft text-success',
  declined: 'bg-danger-soft text-danger-ink',
  cancelled: 'bg-soft text-muted',
};

/** Confetti for an accepted or completed swap. */
const BURST = Array.from({ length: 12 }, (_, index) => {
  const angle = (index / 12) * Math.PI * 2;
  return {
    dx: Math.round(Math.cos(angle) * 70),
    dy: Math.round(Math.sin(angle) * 46),
    color: ['#AD46FF', '#F6339A', '#FFB900', '#22C55E', '#2AABEE'][index % 5],
  };
});

/** "5 min ago", "yesterday", in the interface language. */
function timeAgo(iso: string, locale: string): string {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['second', 60],
    ['minute', 60],
    ['hour', 24],
    ['day', 7],
    ['week', 4.35],
    ['month', 12],
  ];
  let value = seconds;
  for (const [unit, size] of steps) {
    if (Math.abs(value) < size) return format.format(Math.round(value), unit);
    value /= size;
  }
  return format.format(Math.round(value), 'year');
}

function SubjectPill({ label, name, category }: { label: string; name: string; category: Category }) {
  const palette = paletteFor(category);
  return (
    <div style={{ backgroundColor: palette.bg }} className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-xl px-3 py-2.5">
      <span style={{ color: palette.label }} className="text-[10px] font-semibold tracking-[0.8px] uppercase">
        {label}
      </span>
      <span style={{ color: palette.title }} className="truncate text-sm font-bold">
        {name}
      </span>
    </div>
  );
}

function ContactButton({ item, t }: { item: SwapRequestItem; t: Messages }) {
  if (!item.contact) return null;
  const telegram = item.contact.method === 'telegram';
  return (
    <a
      href={telegram ? `https://t.me/${item.contact.value}` : `mailto:${item.contact.value}`}
      target={telegram ? '_blank' : undefined}
      rel="noreferrer"
      className="shine flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand-from to-brand-to px-3 text-sm font-bold text-white shadow-[0_4px_12px_rgba(173,70,255,0.25)] transition active:scale-[0.98]"
    >
      {telegram ? <Send className="size-4" strokeWidth={2.4} /> : <Mail className="size-4" strokeWidth={2.4} />}
      <span className="truncate">{telegram ? `@${item.contact.value}` : t.card.contact.email}</span>
    </a>
  );
}

function RequestCard({
  item,
  highlighted,
  index,
  onAction,
}: {
  item: SwapRequestItem;
  highlighted: boolean;
  index: number;
  onAction: (kind: 'accept' | 'decline' | 'cancel' | 'complete', item: SwapRequestItem) => Promise<void>;
}) {
  const { t, locale } = useI18n();
  const [busy, setBusy] = useState<string | null>(null);
  // Confetti when this card becomes accepted / completed while on screen.
  const [lastStatus, setLastStatus] = useState(item.status);
  const [celebrate, setCelebrate] = useState(0);
  if (item.status !== lastStatus) {
    setLastStatus(item.status);
    if (item.status === 'accepted' || item.status === 'completed') setCelebrate((n) => n + 1);
  }

  const run = async (kind: 'accept' | 'decline' | 'cancel' | 'complete') => {
    setBusy(kind);
    try {
      await onAction(kind, item);
    } finally {
      setBusy(null);
    }
  };

  const incoming = item.direction === 'incoming';
  // The card belongs to the owner: the sender teaches what the card needs and learns what it offers.
  const theyTeach = incoming ? item.needed : item.offered;
  const youTeach = incoming ? item.offered : item.needed;
  const closed = item.status === 'declined' || item.status === 'cancelled';
  const spinner = <Loader2 className="size-4 animate-spin" />;

  return (
    <li
      style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
      className={`relative flex animate-rise flex-col gap-3 rounded-3xl border bg-surface p-4 transition-[opacity,border-color] duration-300 motion-reduce:animate-none ${
        highlighted ? 'border-brand-from shadow-[0_0_0_3px_rgba(173,70,255,0.12)]' : 'border-line'
      } ${closed ? 'opacity-60' : ''}`}
    >
      {celebrate > 0 && (
        <span key={celebrate} aria-hidden className="burst pointer-events-none absolute inset-0">
          {BURST.map((dot, i) => (
            <span key={i} style={{ backgroundColor: dot.color, '--dx': `${dot.dx}px`, '--dy': `${dot.dy}px` } as CSSProperties} />
          ))}
        </span>
      )}

      {/* Who */}
      <div className="flex items-center gap-3">
        <UserAvatar initials={getInitials(item.other.name)} path={item.other.avatarPath} className="size-11 text-sm font-bold" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-1.5 truncate text-[15px] font-bold text-ink">
            {highlighted && <span aria-hidden className="size-2 shrink-0 rounded-full bg-brand-to" />}
            <span className="truncate">{item.other.name}</span>
          </span>
          <span className="truncate text-xs font-medium text-muted">
            {formatStudyInfo(t, item.other.major, item.other.year)} · {timeAgo(item.updatedAt, locale)}
          </span>
        </div>
        <span
          key={item.status}
          className={`shrink-0 animate-pop rounded-full px-2.5 py-1 text-[11px] font-bold motion-reduce:animate-none ${STATUS_STYLE[item.status]}`}
        >
          {t.requests.status[item.status]}
        </span>
      </div>

      {/* What */}
      <div className="relative flex gap-2">
        <SubjectPill label={t.requests.theyTeach} name={theyTeach.name} category={theyTeach.category} />
        <SubjectPill label={t.requests.youTeachShort} name={youTeach.name} category={youTeach.category} />
        <span className="pointer-events-none absolute top-1/2 left-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface">
          <ExchangeIcon className="size-7" />
        </span>
      </div>

      {item.message && (
        <p className="rounded-2xl rounded-tl-md bg-soft px-3.5 py-2.5 text-sm font-medium break-words whitespace-pre-line text-ink">
          {item.message}
        </p>
      )}

      {/* Actions */}
      {incoming && item.status === 'pending' && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void run('decline')}
            disabled={busy !== null}
            className="flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-line-strong bg-surface text-sm font-bold text-ink transition hover:bg-soft active:scale-[0.98] disabled:opacity-60"
          >
            {busy === 'decline' ? spinner : <X className="size-4" strokeWidth={2.6} />}
            {t.requests.decline}
          </button>
          <button
            type="button"
            onClick={() => void run('accept')}
            disabled={busy !== null}
            className="shine flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-linear-to-r from-brand-from to-brand-to text-sm font-bold text-white shadow-[0_4px_12px_rgba(173,70,255,0.25)] transition active:scale-[0.98] disabled:opacity-60"
          >
            {busy === 'accept' ? spinner : <Check className="size-4" strokeWidth={2.8} />}
            {t.requests.accept}
          </button>
        </div>
      )}

      {!incoming && item.status === 'pending' && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-muted">{t.requests.waiting}</span>
          <button
            type="button"
            onClick={() => void run('cancel')}
            disabled={busy !== null}
            className="flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-line-strong px-3 text-xs font-bold text-ink transition hover:bg-soft active:scale-95 disabled:opacity-60"
          >
            {busy === 'cancel' ? spinner : <Undo2 className="size-3.5" strokeWidth={2.6} />}
            {t.requests.cancel}
          </button>
        </div>
      )}

      {item.status === 'accepted' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted">{t.requests.acceptedHint}</p>
          <div className="flex gap-2">
            <ContactButton item={item} t={t} />
            <button
              type="button"
              onClick={() => void run('complete')}
              disabled={busy !== null}
              className="flex h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-success/40 bg-success-soft px-3 text-sm font-bold text-success transition active:scale-[0.98] disabled:opacity-60"
            >
              {busy === 'complete' ? spinner : <CheckCheck className="size-4" strokeWidth={2.6} />}
              {t.requests.complete}
            </button>
          </div>
        </div>
      )}

      {item.status === 'completed' && (
        <div className="flex gap-2">
          <ContactButton item={item} t={t} />
        </div>
      )}

      {!incoming && item.status === 'declined' && <p className="text-xs font-medium text-muted">{t.requests.declinedHint}</p>}
    </li>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const t = useT();
  return (
    <div className="flex animate-pop flex-col items-center gap-2 rounded-3xl border border-dashed border-line-strong bg-surface/60 px-6 py-12 text-center motion-reduce:animate-none">
      <span className="flex size-14 animate-float items-center justify-center rounded-full bg-soft motion-reduce:animate-none">
        {tab === 'incoming' ? (
          <Inbox aria-hidden className="size-6 text-brand-from" strokeWidth={2} />
        ) : (
          <Send aria-hidden className="size-6 text-brand-from" strokeWidth={2} />
        )}
      </span>
      <p className="text-sm font-bold text-ink">{tab === 'incoming' ? t.requests.emptyIncoming : t.requests.emptySent}</p>
      <p className="text-xs font-medium text-muted">
        {tab === 'incoming' ? t.requests.emptyIncomingHint : t.requests.emptySentHint}
      </p>
    </div>
  );
}

function RequestsView() {
  const t = useT();
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>(params.get('tab') === 'sent' ? 'sent' : 'incoming');
  const { items } = useRequests();
  const { toast, show: showToast, hide: hideToast } = useToast();

  // Answers I had not seen stay highlighted while I am on the page.
  const [highlighted, setHighlighted] = useState<Set<string> | null>(null);
  if (highlighted === null && items !== null) {
    setHighlighted(new Set(items.filter((item) => item.unseen).map((item) => item.id)));
  }

  useEffect(() => {
    if (tab === 'sent') void markRequestsSeen();
  }, [tab, items]);

  const incoming = useMemo(() => items?.filter((item) => item.direction === 'incoming') ?? [], [items]);
  const sent = useMemo(() => items?.filter((item) => item.direction === 'outgoing') ?? [], [items]);
  const pendingIncoming = incoming.filter((item) => item.status === 'pending').length;
  const unseenSent = sent.filter((item) => item.unseen).length;
  const list = tab === 'incoming' ? incoming : sent;

  const pick = (next: Tab) => {
    setTab(next);
    window.history.replaceState(null, '', next === 'sent' ? '/requests?tab=sent' : '/requests');
  };

  const onAction = async (kind: 'accept' | 'decline' | 'cancel' | 'complete', item: SwapRequestItem) => {
    try {
      if (kind === 'accept') await respondSwapRequest(item.id, true);
      if (kind === 'decline') await respondSwapRequest(item.id, false);
      if (kind === 'cancel') await cancelSwapRequest(item.id);
      if (kind === 'complete') await completeSwap(item.id);
      showToast(t.requests.toast[kind]);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : t.common.somethingWrong);
    }
  };

  const tabs: { value: Tab; label: string; count: number }[] = [
    { value: 'incoming', label: t.requests.incoming, count: pendingIncoming },
    { value: 'sent', label: t.requests.sentTab, count: unseenSent },
  ];

  return (
    <MobileShell
      footer={
        <div className="relative">
          <Toast toast={toast} onHide={hideToast} />
          <BottomNav active={null} />
        </div>
      }
    >
      <AppHeader />

      <div className="flex flex-col gap-4 px-4 py-2">
        <div className="flex animate-rise flex-col gap-1 motion-reduce:animate-none">
          <h1 className="font-bricolage text-3xl leading-8 font-extrabold text-ink">{t.requests.title}</h1>
          <p className="text-sm font-semibold text-muted">{t.requests.subtitle}</p>
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          style={{ animationDelay: '60ms' }}
          className="relative grid animate-rise grid-cols-2 rounded-2xl bg-soft p-1 motion-reduce:animate-none"
        >
          <span
            aria-hidden
            className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-xl bg-linear-to-r from-brand-from to-brand-to shadow-[0_4px_10px_rgba(173,70,255,0.3)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              tab === 'sent' ? 'translate-x-full' : 'translate-x-0'
            }`}
          />
          {tabs.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={tab === item.value}
              onClick={() => pick(item.value)}
              className={`relative flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl text-sm font-bold transition-colors duration-300 ${
                tab === item.value ? 'text-white' : 'text-ink'
              }`}
            >
              {item.label}
              {item.count > 0 && (
                <span
                  className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold ${
                    tab === item.value ? 'bg-white/25 text-white' : 'bg-brand-to text-white'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {items === null ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted">
            <Loader2 className="size-6 animate-spin text-brand-from" />
            <span className="text-xs font-medium">{t.requests.loading}</span>
          </div>
        ) : list.length === 0 ? (
          <EmptyState key={tab} tab={tab} />
        ) : (
          <ul key={tab} className="flex flex-col gap-3">
            {list.map((item, index) => (
              <RequestCard
                key={item.id}
                item={item}
                index={index}
                highlighted={Boolean(highlighted?.has(item.id))}
                onAction={onAction}
              />
            ))}
          </ul>
        )}
      </div>
    </MobileShell>
  );
}

export default function RequestsPage() {
  return (
    <Suspense>
      <RequestsView />
    </Suspense>
  );
}
