'use client';

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { APP_SCROLL_ID } from '@/components/layout/MobileShell';

/** Must match the duration-300 transition below. */
const EXIT_MS = 300;
/** Drag distance (px) after which a swipe down closes the sheet. */
const SWIPE_CLOSE_PX = 100;

/**
 * Stops the page under the sheet from scrolling (the window, or #app-scroll in
 * app-scroll mode) and returns a function that undoes it. Touch swipes are handled
 * separately: they are swallowed inside the dialog, so iOS never moves the page.
 */
function lockPageScroll(): () => void {
  const html = document.documentElement;
  const scroller = document.getElementById(APP_SCROLL_ID);
  const previous = { html: html.style.overflow, scroller: scroller?.style.overflowY ?? '' };
  html.style.overflow = 'hidden';
  if (scroller) scroller.style.overflowY = 'hidden';
  return () => {
    html.style.overflow = previous.html;
    if (scroller) scroller.style.overflowY = previous.scroller;
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
  /** The scrolling body; swipes inside it may scroll it, nothing else may scroll. */
  const scrollRef = useRef<HTMLDivElement>(null);
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
      // Force layout right after the dialog enters the top layer: iOS WebKit otherwise
      // paints the sheet at a stale position until the next tap.
      void dialog.getBoundingClientRect();
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

  // iOS Safari: a swipe that the sheet body cannot use goes to the browser, which then
  // collapses its address bar and drags the whole sheet up (seen when the page is near
  // the top, where the bar is still expanded). Swallow every such swipe.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    let startY = 0;

    const onTouchStart = (event: TouchEvent) => {
      startY = event.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (event: TouchEvent) => {
      const scroller = scrollRef.current;
      const target = event.target as Node | null;
      if (scroller && target && scroller.contains(target)) {
        const deltaY = (event.touches[0]?.clientY ?? 0) - startY;
        const atTop = scroller.scrollTop <= 0;
        const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1;
        // Let the body scroll as long as it has room in the swipe's direction.
        if (!(deltaY > 0 && atTop) && !(deltaY < 0 && atBottom)) return;
      }
      if (event.cancelable) event.preventDefault();
    };

    dialog.addEventListener('touchstart', onTouchStart, { passive: true });
    dialog.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      dialog.removeEventListener('touchstart', onTouchStart);
      dialog.removeEventListener('touchmove', onTouchMove);
    };
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
        className={`absolute inset-0 touch-none bg-ink/55 transition-opacity duration-300 motion-reduce:transition-none ${
          shown ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Pinned to the bottom edge itself (not aligned inside a full-height box) and moved
          with a plain 3D transform: the most reliable combination on iOS WebKit. */}
      <div
        style={{
          transform: shown ? `translate3d(0, ${dragY}px, 0)` : 'translate3d(0, 100%, 0)',
          willChange: 'transform',
        }}
        className={`fixed inset-x-0 bottom-0 mx-auto flex max-h-[80%] w-full max-w-[576px] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-8px_32px_rgba(27,21,48,0.18)] ${
          dragY ? '' : 'transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none'
        }`}
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

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
          {/* Fades the text out above the actions while there is more to scroll */}
          <div aria-hidden className="pointer-events-none sticky bottom-0 -mt-10 h-10 bg-linear-to-t from-white to-white/0" />
        </div>

        {footer}
      </div>
    </dialog>
  );
}
