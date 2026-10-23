'use client';

import { useCallback, useEffect, useState } from 'react';

/** How long a toast stays on screen (ms). */
const TOAST_MS = 2600;

interface ToastState {
  message: string;
  /** New for every call, so the same message can show again. */
  key: number;
}

/** Shows short messages in a <Toast>; call show("...") from anywhere on the page. */
export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const show = useCallback((message: string) => setToast((prev) => ({ message, key: (prev?.key ?? 0) + 1 })), []);
  const hide = useCallback(() => setToast(null), []);
  return { toast, show, hide };
}

interface ToastProps {
  toast: ToastState | null;
  onHide: () => void;
}

/**
 * Small dark message above the bottom bar. Render it inside a `relative` wrapper
 * in MobileShell's footer (or an empty one on pages without a nav).
 */
export function Toast({ toast, onHide }: ToastProps) {
  const [last, setLast] = useState(toast);
  if (toast && toast !== last) setLast(toast);
  const shown = toast ?? last;

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onHide, TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast, onHide]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none absolute inset-x-4 bottom-full mb-3 flex justify-center transition-[opacity,transform] duration-300 ease-out ${
        toast ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
    >
      {shown && (
        <span
          key={shown.key}
          className="animate-pop rounded-2xl bg-toast px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_10px_28px_rgba(27,21,48,0.3)] motion-reduce:animate-none"
        >
          {shown.message}
        </span>
      )}
    </div>
  );
}
