'use client';

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { AlertCircle, Check, Loader2, RefreshCw, Send, X } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import {
  TELEGRAM_BOT,
  createTelegramLink,
  fetchMyTelegramHandle,
  fetchTelegramLinkStatus,
  telegramLinkUrl,
  type TelegramLinkStatus,
} from '@/lib/telegram';
import { useReplay } from '@/lib/useReplay';
import { playSound } from '@/lib/sound';
import { messages, useT } from '@/i18n';

/** How often the site asks whether the bot finished the link. */
const POLL_MS = 2000;
/** How long the success state stays before the sheet closes. */
const SUCCESS_MS = 1600;

const BURST = Array.from({ length: 14 }, (_, index) => {
  const angle = (index / 14) * Math.PI * 2;
  const distance = 62 + (index % 3) * 12;
  return {
    dx: Math.round(Math.cos(angle) * distance),
    dy: Math.round(Math.sin(angle) * distance),
    color: ['#2AABEE', '#AD46FF', '#F6339A', '#FFB900', '#22C55E'][index % 5],
  };
});

type FlowState =
  | { step: 'creating' }
  | { step: 'error'; message: string }
  | { step: 'open'; token: string; status: Exclude<TelegramLinkStatus, 'linked'> }
  | { step: 'linked'; handle: string };

interface TelegramLinkSheetProps {
  open: boolean;
  onClose: () => void;
  /** Called with the new handle once the bot links it. */
  onLinked: (handle: string) => void;
  /** Linking again replaces the current handle ("Change"). */
  currentHandle?: string | null;
}

/** Link (or change) Telegram: open the bot, the site notices the link by itself. */
export function TelegramLinkSheet({ open, onClose, onLinked, currentHandle = null }: TelegramLinkSheetProps) {
  const t = useT();
  const titleId = useId();
  /** Counts openings, so every opening starts with a fresh link. */
  const [session, setSession] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSession((n) => n + 1);
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      header={
        <div className="flex items-center justify-between px-6 py-2">
          <h2 id={titleId} className="font-bricolage text-[22px] font-extrabold text-ink">
            {currentHandle ? t.telegram.changeTitle : t.telegram.link}
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
      {session > 0 && (
        <LinkFlow key={session} active={open} currentHandle={currentHandle} onClose={onClose} onLinked={onLinked} />
      )}
    </BottomSheet>
  );
}

function LinkFlow({
  active,
  currentHandle,
  onClose,
  onLinked,
}: {
  active: boolean;
  currentHandle: string | null;
  onClose: () => void;
  onLinked: (handle: string) => void;
}) {
  const t = useT();
  const [state, setState] = useState<FlowState>({ step: 'creating' });
  const [launching, launch] = useReplay(900);
  const finished = useRef(false);

  const start = useCallback(async () => {
    setState({ step: 'creating' });
    try {
      const token = await createTelegramLink();
      setState({ step: 'open', token, status: 'pending' });
    } catch (err: unknown) {
      setState({ step: 'error', message: err instanceof Error ? err.message : messages().telegram.createError });
    }
  }, []);

  useEffect(() => {
    // A link is made as soon as the sheet opens, so the button can open Telegram directly
    // (iOS blocks pop-ups opened after waiting for the network).
    void Promise.resolve().then(start);
  }, [start]);

  const token = state.step === 'open' ? state.token : null;
  const waiting = state.step === 'open' && (state.status === 'pending' || state.status === 'no_username');

  // Ask every couple of seconds, and right away when the student comes back from Telegram.
  useEffect(() => {
    if (!active || !token || !waiting) return;
    let cancelled = false;

    const check = async () => {
      try {
        const status = await fetchTelegramLinkStatus(token);
        if (cancelled || finished.current) return;
        if (status === 'linked') {
          finished.current = true;
          const handle = (await fetchMyTelegramHandle()) ?? '';
          if (cancelled) return;
          setState({ step: 'linked', handle });
          playSound('linked');
          window.setTimeout(() => {
            onLinked(handle);
            onClose();
          }, SUCCESS_MS);
        } else {
          setState((prev) => (prev.step === 'open' && prev.status !== status ? { ...prev, status } : prev));
        }
      } catch (err: unknown) {
        console.error('Could not check the Telegram link:', err);
      }
    };

    const timer = window.setInterval(check, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void check();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [active, token, waiting, onClose, onLinked]);

  const linked = state.step === 'linked';
  const problem =
    state.step === 'error' || (state.step === 'open' && (state.status === 'taken' || state.status === 'expired'));

  return (
    <div className="flex flex-col items-center gap-5 px-6 pt-4 pb-10 text-center">
      {/* The plane: ripples while waiting, a burst of dots when linked */}
      <div className="relative flex size-28 items-center justify-center">
        {waiting && (
          <>
            <span aria-hidden className="tg-ripple absolute inset-2 rounded-full bg-[#2AABEE]" />
            <span aria-hidden style={{ animationDelay: '0.9s' }} className="tg-ripple absolute inset-2 rounded-full bg-[#2AABEE]" />
          </>
        )}
        {linked && (
          <span aria-hidden className="burst absolute inset-0">
            {BURST.map((dot, index) => (
              <span
                key={index}
                style={{ backgroundColor: dot.color, '--dx': `${dot.dx}px`, '--dy': `${dot.dy}px` } as CSSProperties}
              />
            ))}
          </span>
        )}
        <span
          className={`relative flex size-24 items-center justify-center rounded-full text-white shadow-[0_10px_24px_rgba(34,158,217,0.35)] transition-colors duration-500 ${
            linked
              ? 'bg-linear-to-br from-[#34D399] to-[#059669]'
              : problem
                ? 'bg-linear-to-br from-[#F87171] to-[#C0264B]'
                : 'bg-linear-to-br from-[#2AABEE] to-[#229ED9]'
          }`}
        >
          {linked ? (
            <Check key="check" className="size-11 animate-pop motion-reduce:animate-none" strokeWidth={3} />
          ) : problem ? (
            <AlertCircle key="alert" className="size-11 animate-pop motion-reduce:animate-none" strokeWidth={2.4} />
          ) : state.step === 'creating' ? (
            <Loader2 className="size-9 animate-spin" />
          ) : (
            <span className={launching ? 'tg-launch' : 'tg-fly'}>
              <Send className="size-10 -translate-x-0.5 translate-y-0.5" strokeWidth={2.2} />
            </span>
          )}
        </span>
      </div>

      <StatusText state={state} currentHandle={currentHandle} />

      {state.step === 'open' && waiting && (
        <a
          href={telegramLinkUrl(state.token)}
          target="_blank"
          rel="noreferrer"
          onClick={launch}
          className="shine flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl bg-linear-to-r from-[#2AABEE] to-[#229ED9] text-base font-bold text-white shadow-[0_6px_16px_rgba(34,158,217,0.3)] transition active:scale-[0.98]"
        >
          <img src="/telegram.svg" alt="" className="size-6 shrink-0" />
          {state.status === 'no_username' ? t.telegram.openAgain : t.telegram.open}
        </a>
      )}

      {problem && (
        <button
          type="button"
          onClick={() => void start()}
          className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-line-strong bg-surface text-sm font-bold text-ink transition hover:bg-soft active:scale-[0.98]"
        >
          <RefreshCw className="size-4" />
          {t.telegram.newLink}
        </button>
      )}
    </div>
  );
}

function StatusText({ state, currentHandle }: { state: FlowState; currentHandle: string | null }) {
  const t = useT();
  let title: string;
  let body: string;
  let tone = 'text-muted';

  if (state.step === 'creating') {
    title = t.telegram.preparing;
    body = t.telegram.oneMoment;
  } else if (state.step === 'error') {
    title = t.telegram.createError;
    body = state.message;
    tone = 'text-danger';
  } else if (state.step === 'linked') {
    title = t.telegram.linkedTitle(state.handle);
    body = t.telegram.linkedBody;
  } else if (state.status === 'no_username') {
    title = t.telegram.noUsernameTitle;
    body = t.telegram.noUsernameBody;
    tone = 'text-warning';
  } else if (state.status === 'taken') {
    title = t.telegram.takenTitle;
    body = t.telegram.takenBody;
    tone = 'text-danger';
  } else if (state.status === 'expired') {
    title = t.telegram.expiredTitle;
    body = t.telegram.expiredBody;
    tone = 'text-danger';
  } else {
    title = t.telegram.waitingTitle;
    body = t.telegram.waitingBody(TELEGRAM_BOT, currentHandle);
  }

  return (
    <div key={title} className="flex animate-rise flex-col gap-1.5 motion-reduce:animate-none" aria-live="polite">
      <p className="font-bricolage text-xl font-extrabold text-ink">{title}</p>
      <p className={`text-sm font-medium ${tone}`}>{body}</p>
    </div>
  );
}
