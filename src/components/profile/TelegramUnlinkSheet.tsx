'use client';

import { useId, useState } from 'react';
import { Loader2, Mail, Unlink, X } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { unlinkTelegram } from '@/lib/telegram';

interface TelegramUnlinkSheetProps {
  open: boolean;
  handle: string | null;
  onClose: () => void;
  onUnlinked: () => void;
}

/** "Unlink @handle?" confirmation; students then contact the owner by e-mail. */
export function TelegramUnlinkSheet({ open, handle, onClose, onUnlinked }: TelegramUnlinkSheetProps) {
  const titleId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The handle stays visible while the sheet slides away after unlinking. */
  const [shownHandle, setShownHandle] = useState(handle);
  if (handle && handle !== shownHandle) setShownHandle(handle);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await unlinkTelegram();
      onUnlinked();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not unlink Telegram');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      header={
        <div className="flex items-center justify-between px-6 py-2">
          <h2 id={titleId} className="font-bricolage text-[22px] font-extrabold text-ink">
            Unlink Telegram?
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
    >
      <div className="flex flex-col gap-4 px-6 pt-2 pb-10">
        <div className="flex h-12 items-center gap-2.5 rounded-2xl bg-soft px-3.5 text-base font-semibold text-ink">
          <img src="/telegram-circle.svg" alt="" className="size-7 shrink-0" />@{shownHandle}
        </div>
        <p className="flex items-start gap-2 text-sm font-medium text-muted">
          <Mail aria-hidden className="mt-0.5 size-4 shrink-0" />
          Your cards will show &quot;Send an Email&quot; instead of Telegram. You can link Telegram again any time.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-12 cursor-pointer rounded-2xl border border-line-strong bg-surface text-sm font-bold text-ink transition hover:bg-soft active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={busy}
            className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#C0264B] text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Unlink className="size-4" />}
            Unlink
          </button>
        </div>
        {error && (
          <p className="animate-shake rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>
        )}
      </div>
    </BottomSheet>
  );
}
