'use client';

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';

/** Must match the duration-300 transition below. */
const EXIT_MS = 300;
/** Drag distance (px) after which a swipe down closes the sheet. */
const SWIPE_CLOSE_PX = 100;

/**
 * Freezes the page under the sheet and returns a function that unfreezes it.
 *
 * `overflow: hidden` on <html> is enough on desktop, but iOS Safari still scrolls
 * the page on touch, and the open sheet moved up with it. Pinning <body> with
 * position: fixed at the current scroll offset stops that on every browser.
 */
function lockPageScroll(): () => void {
  const { body, documentElement: html } = document;
  const scrollY = window.scrollY;
  const previous = {
    htmlOverflow: html.style.overflow,
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    overflow: body.style.overflow,
  };

  html.style.overflow = 'hidden';
  body.style.position = 'fixed';
  body.style.top = `-${scrollY}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.width = '100%';
  body.style.overflow = 'hidden';

  return () => {
    html.style.overflow = previous.htmlOverflow;
    body.style.position = previous.position;
    body.style.top = previous.top;
    body.style.left = previous.left;
    body.style.right = previous.right;
    body.style.width = previous.width;
    body.style.overflow = previous.overflow;
    // Back to where the student was, without the smooth-scroll animation.
    window.scrollTo({ top: scrollY, behavior: 'instant' });
  };
}

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  /** id of the element that names the dialog (its title). */
  labelledBy: string;
  /** Title row. The drag handle is added above it on mobile. */
  header: ReactNode;
  /** Sticky actions under the scrolling body. */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Accessible modal built on the native <dialog> element:
 * focus is trapped and returned to the trigger by the browser, Escape closes it.
 *
 * Mobile-first bottom sheet: swipe down, tap the backdrop, × or Escape to close.
 */
export function BottomSheet({ open, onClose, labelledBy, header, footer, children }: BottomSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dragStart = useRef<number | null>(null);
  /** Latest drag distance; read on pointerup so a fast swipe is not lost between renders. */
  const dragDistance = useRef(0);
  const [entered, setEntered] = useState(false);
  const [dragY, setDragY] = useState(0);
  const shown = open && entered;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
      const unlockScroll = lockPageScroll();
      // Two frames so the closed styles are painted before the enter transition starts.
      let second = 0;
      const first = requestAnimationFrame(() => {
        second = requestAnimationFrame(() => setEntered(true));
      });
      return () => {
        cancelAnimationFrame(first);
        cancelAnimationFrame(second);
        unlockScroll();
      };
    }

    if (!dialog.open) return;
    // Let the exit transition play, then really close the dialog.
    const timer = window.setTimeout(() => {
      dialog.close();
      setEntered(false);
      setDragY(0);
    }, EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return;
    dragStart.current = event.clientY;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Capture is a nice-to-have; dragging still works without it.
    }
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    dragDistance.current = Math.max(0, event.clientY - dragStart.current);
    setDragY(dragDistance.current);
  };
  const onPointerEnd = () => {
    if (dragStart.current === null) return;
    dragStart.current = null;
    const distance = dragDistance.current;
    dragDistance.current = 0;
    if (distance > SWIPE_CLOSE_PX) onClose();
    else setDragY(0);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        // Escape: animate out instead of closing instantly.
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-hidden overscroll-none bg-transparent p-0 backdrop:bg-transparent"
    >
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={`absolute inset-0 touch-none bg-ink/50 backdrop-blur-[6px] transition-opacity duration-300 motion-reduce:transition-none ${
          shown ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div className="pointer-events-none absolute inset-0 flex items-end justify-center">
        <div
          style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
          className={`pointer-events-auto relative flex max-h-[80dvh] w-full max-w-[576px] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-8px_32px_rgba(27,21,48,0.18)] ${
            dragY ? '' : 'transition-[translate] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none'
          } ${shown ? 'translate-y-0' : 'translate-y-full'}`}
        >
          {/* Handle + title: drag here to swipe the sheet down */}
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            className="shrink-0 touch-none select-none"
          >
            <div className="flex justify-center pt-2.5 pb-0.5">
              <span className="h-[5px] w-10 rounded-full bg-line-strong" />
            </div>
            {header}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {children}
            {/* Fades the text out above the actions while there is more to scroll */}
            <div aria-hidden className="pointer-events-none sticky bottom-0 -mt-10 h-10 bg-linear-to-t from-white to-white/0" />
          </div>

          {footer}
        </div>
      </div>
    </dialog>
  );
}
