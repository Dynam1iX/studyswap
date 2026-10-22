'use client';

import { useEffect, useState } from 'react';
import { Undo2 } from 'lucide-react';

/** How long the toast stays before the removal becomes final (ms). */
export const UNDO_MS = 4000;

interface UndoToastProps {
  /** Changes for every new removal, so the timer and bar restart. null hides the toast. */
  toastKey: string | null;
  message: string;
  onUndo: () => void;
  /** Called when the time is up without an undo. */
  onExpire: () => void;
}

/** "Removed from favorites · Undo" bar above the nav, with a shrinking time bar. */
export function UndoToast({ toastKey, message, onUndo, onExpire }: UndoToastProps) {
  // Keep the last text while the toast fades out.
  const [shownKey, setShownKey] = useState(toastKey);
  const [shownMessage, setShownMessage] = useState(message);
  if (toastKey && toastKey !== shownKey) {
    setShownKey(toastKey);
    setShownMessage(message);
  }

  useEffect(() => {
    if (!toastKey) return;
    const timer = window.setTimeout(onExpire, UNDO_MS);
    return () => window.clearTimeout(timer);
  }, [toastKey, onExpire]);

  const visible = toastKey !== null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none absolute inset-x-4 bottom-full mb-3 transition-[opacity,transform] duration-300 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
    >
      <div
        key={shownKey ?? 'none'}
        className={`relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl bg-ink py-3 pr-2 pl-4 text-white shadow-[0_10px_28px_rgba(27,21,48,0.3)] ${
          visible ? 'pointer-events-auto animate-pop motion-reduce:animate-none' : ''
        }`}
      >
        <span className="truncate text-sm font-semibold">{shownMessage}</span>
        <button
          type="button"
          onClick={onUndo}
          disabled={!visible}
          className="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3 text-sm font-bold transition hover:bg-white/10 active:scale-95"
        >
          <Undo2 aria-hidden className="size-4" strokeWidth={2.4} />
          <span className="bg-linear-to-r from-[#D59BFF] to-[#FF8FC6] bg-clip-text text-transparent">Undo</span>
        </button>
        {/* Time left to undo */}
        {visible && (
          <span
            aria-hidden
            style={{ animationDuration: `${UNDO_MS}ms` }}
            className="absolute bottom-0 left-0 h-[3px] w-full origin-left animate-drain bg-linear-to-r from-brand-from to-brand-to motion-reduce:animate-none"
          />
        )}
      </div>
    </div>
  );
}
