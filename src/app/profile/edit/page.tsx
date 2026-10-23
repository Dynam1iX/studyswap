'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft, Loader2, Lock, RefreshCw, Unlink } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { MobileShell } from '@/components/layout/MobileShell';
import { Avatar } from '@/components/profile/Avatar';
import { TelegramLinkSheet } from '@/components/profile/TelegramLinkSheet';
import { TelegramUnlinkSheet } from '@/components/profile/TelegramUnlinkSheet';
import { AvatarSheet } from '@/components/profile/AvatarSheet';
import { useAvatarEditor } from '@/components/profile/useAvatarEditor';
import { Toast, useToast } from '@/components/ui/Toast';
import { degreeLabel, fetchProfile, type ProfileUser } from '@/lib/profile';
import { messages, useT } from '@/i18n';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; user: ProfileUser };

function SectionTitle({ children }: { children: string }) {
  return <h2 className="font-bricolage text-lg font-extrabold text-ink">{children}</h2>;
}

/** A read-only field: these come from the university's Microsoft account. */
function ReadOnlyField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-b-0">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs font-semibold text-muted">{label}</span>
        <span className="truncate text-[15px] font-bold text-ink">{value || '—'}</span>
      </div>
      <Lock aria-hidden className="size-4 shrink-0 text-placeholder" strokeWidth={2.2} />
    </div>
  );
}

function TelegramSection({
  handle,
  onLink,
  onUnlink,
}: {
  handle: string | null;
  onLink: () => void;
  onUnlink: () => void;
}) {
  const t = useT();
  if (!handle) {
    return (
      <div className="flex animate-pop flex-col gap-3 rounded-3xl border border-line bg-surface p-4 motion-reduce:animate-none">
        <p className="text-sm font-medium text-muted">
          {t.telegram.linkHint}
        </p>
        <button
          type="button"
          onClick={onLink}
          aria-haspopup="dialog"
          className="shine flex h-12 cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-linear-to-r from-[#2AABEE] to-[#229ED9] text-base font-bold text-white shadow-[0_6px_16px_rgba(34,158,217,0.3)] transition active:scale-[0.98]"
        >
          <img src="/telegram.svg" alt="" className="size-6 shrink-0" />
          {t.telegram.link}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <div
        key={handle}
        className="flex h-12 animate-pop items-center gap-2.5 rounded-2xl bg-soft px-3.5 text-base font-semibold text-ink motion-reduce:animate-none"
      >
        <img src="/telegram-circle.svg" alt="" className="size-7 shrink-0" />@{handle}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onLink}
          aria-haspopup="dialog"
          className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-line-strong bg-surface text-sm font-bold text-ink transition hover:bg-soft active:scale-[0.98]"
        >
          <RefreshCw className="size-4" />
          {t.telegram.change}
        </button>
        <button
          type="button"
          onClick={onUnlink}
          aria-haspopup="dialog"
          className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-danger-line bg-surface text-sm font-bold text-danger-ink transition hover:bg-danger-soft active:scale-[0.98]"
        >
          <Unlink className="size-4" />
          {t.telegram.unlink}
        </button>
      </div>
    </div>
  );
}

/** Profile settings: Telegram link and the student's details (read-only, from Microsoft). */
export default function EditProfilePage() {
  const t = useT();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const { toast, show: showToast, hide: hideToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    fetchProfile()
      .then((data) => {
        if (cancelled) return;
        setState(data ? { status: 'ready', user: data.user } : { status: 'error', message: messages().profile.notFound });
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ status: 'error', message: err instanceof Error ? err.message : messages().profile.loadError });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const avatar = useAvatarEditor(state.status === 'ready' ? state.user : null, {
    notify: showToast,
    onChange: (avatarPath) =>
      setState((prev) =>
        prev.status === 'ready' ? { status: 'ready', user: { ...prev.user, avatarPath } } : prev,
      ),
  });

  const [telegramSheet, setTelegramSheet] = useState<'link' | 'unlink' | null>(null);
  const setHandle = (telegramHandle: string | null) =>
    setState((prev) => (prev.status === 'ready' ? { status: 'ready', user: { ...prev.user, telegramHandle } } : prev));

  return (
    <MobileShell
      footer={
        <div className="relative">
          <Toast toast={toast} onHide={hideToast} />
        </div>
      }
    >
      <AppHeader />

      <div className="flex flex-col gap-4 px-4 py-2">
        <div className="flex animate-rise items-center gap-2 motion-reduce:animate-none">
          <Link
            href="/profile"
            aria-label={t.edit.back}
            className="-ml-2 flex size-11 items-center justify-center rounded-full text-ink transition hover:bg-soft active:scale-90"
          >
            <ChevronLeft className="size-6" strokeWidth={2.4} />
          </Link>
          <h1 className="font-bricolage text-2xl font-extrabold text-ink">{t.edit.title}</h1>
        </div>

        {state.status === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted">
            <Loader2 className="size-6 animate-spin text-brand-from" />
            <span className="text-xs font-medium">{t.profile.loading}</span>
          </div>
        )}

        {state.status === 'error' && (
          <p className="rounded-2xl border border-danger-line bg-surface p-6 text-center text-sm font-medium text-danger-ink">
            {state.message}
          </p>
        )}

        {state.status === 'ready' && (
          <>
            <div style={{ animationDelay: '60ms' }} className="flex animate-rise justify-center motion-reduce:animate-none">
              <Avatar
                initials={state.user.initials}
                url={avatar.displayUrl}
                busy={avatar.busy}
                onEdit={() => avatar.setOpen(true)}
              />
            </div>

            <section style={{ animationDelay: '120ms' }} className="flex animate-rise flex-col gap-3 motion-reduce:animate-none">
              <SectionTitle>Telegram</SectionTitle>
              <TelegramSection
                handle={state.user.telegramHandle}
                onLink={() => setTelegramSheet('link')}
                onUnlink={() => setTelegramSheet('unlink')}
              />
            </section>

            <section style={{ animationDelay: '180ms' }} className="flex animate-rise flex-col gap-3 motion-reduce:animate-none">
              <SectionTitle>{t.edit.details}</SectionTitle>
              <div className="flex flex-col rounded-3xl border border-line bg-surface px-4 py-1">
                <ReadOnlyField label={t.edit.firstName} value={state.user.firstName} />
                <ReadOnlyField label={t.edit.lastName} value={state.user.lastName} />
                <ReadOnlyField label={t.edit.major} value={state.user.major} />
                <ReadOnlyField label={t.edit.yearOfStudy} value={t.common.year(state.user.studyYear)} />
                <ReadOnlyField label={t.edit.degree} value={degreeLabel(t, state.user.degree)} />
                <ReadOnlyField label={t.edit.email} value={state.user.email} />
              </div>
              <p className="flex items-start gap-2 text-xs font-medium text-muted">
                <Lock aria-hidden className="mt-px size-3.5 shrink-0" strokeWidth={2.4} />
                {t.edit.readOnlyNote}
              </p>
            </section>
          </>
        )}
      </div>

      {state.status === 'ready' && (
        <>
          <TelegramLinkSheet
            open={telegramSheet === 'link'}
            onClose={() => setTelegramSheet(null)}
            currentHandle={state.user.telegramHandle}
            onLinked={(handle) => {
              setHandle(handle || null);
              showToast(t.telegram.linkedToast);
            }}
          />
          <TelegramUnlinkSheet
            open={telegramSheet === 'unlink'}
            handle={state.user.telegramHandle}
            onClose={() => setTelegramSheet(null)}
            onUnlinked={() => {
              setHandle(null);
              showToast(t.telegram.unlinkedToast);
            }}
          />
        </>
      )}

      {state.status === 'ready' && (
        <AvatarSheet
          open={avatar.open}
          onClose={() => avatar.setOpen(false)}
          initials={state.user.initials}
          currentUrl={avatar.savedUrl}
          onSave={avatar.save}
          onRemove={avatar.remove}
        />
      )}
    </MobileShell>
  );
}
