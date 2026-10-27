'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { lockPageScroll } from '@/components/ui/BottomSheet';
import { useT } from '@/i18n';

/** Shown size of the photo (CSS px). Photos are stored at 256×256, so it stays sharp enough. */
const PHOTO_PX = 240;
const OPEN_MS = 460;
const CLOSE_MS = 260;

interface AvatarViewerProps {
  url: string;
  name: string;
  subtitle?: string;
  /** The tapped avatar: the photo grows out of it and shrinks back into it. */
  origin: DOMRect;
  onClose: () => void;
  /** Your own photo: a "Change photo" button under it. */
  onChange?: () => void;
}

/** From the photo's place in the centre of the screen to the tapped avatar. */
function fromOrigin(photo: HTMLElement, origin: DOMRect): string {
  const box = photo.getBoundingClientRect();
  const dx = origin.left + origin.width / 2 - (box.left + box.width / 2);
  const dy = origin.top + origin.height / 2 - (box.top + box.height / 2);
  return `translate(${dx}px, ${dy}px) scale(${origin.width / box.width})`;
}

/** A small centred window with the profile photo (phones and desktop alike). */
function AvatarViewer({ url, name, subtitle, origin, onClose, onChange }: AvatarViewerProps) {
  const t = useT();
  const titleId = useId();
  const photoRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const reduced = useRef(false);

  // Grow out of the avatar; the backdrop and the text fade in.
  useLayoutEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const photo = photoRef.current;
    if (!photo) return;
    backdropRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
    if (reduced.current) {
      photo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160 });
    } else {
      photo.animate([{ transform: fromOrigin(photo, origin), borderRadius: '9999px' }, { transform: 'none' }], {
        duration: OPEN_MS,
        easing: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
      });
      textRef.current?.animate(
        [
          { opacity: 0, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 320, delay: 160, easing: 'ease-out', fill: 'backwards' },
      );
    }
    closeRef.current?.focus({ preventScroll: true });
  }, [origin]);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    const photo = photoRef.current;
    backdropRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: CLOSE_MS, fill: 'forwards' });
    textRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' });
    if (!photo) return onClose();
    const animation = reduced.current
      ? photo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: 'forwards' })
      : photo.animate([{ transform: 'none' }, { transform: fromOrigin(photo, origin) }], {
          duration: CLOSE_MS,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'forwards',
        });
    animation.onfinish = onClose;
  };

  // Esc closes; the page underneath does not scroll; focus returns to the avatar after.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const unlock = lockPageScroll();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Only the photo closes, not a sheet underneath it.
        event.stopPropagation();
        event.preventDefault();
        close();
      }
      // The window has at most two buttons: keep Tab inside it.
      if (event.key === 'Tab') {
        const buttons = [...(backdropRef.current?.querySelectorAll<HTMLElement>('button') ?? [])];
        const index = buttons.indexOf(document.activeElement as HTMLElement);
        event.preventDefault();
        event.stopPropagation();
        buttons[(index + (event.shiftKey ? buttons.length - 1 : 1)) % buttons.length]?.focus();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      unlock();
      previous?.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={close}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(20,12,40,0.55)] p-6 backdrop-blur-md"
    >
      <div onClick={(event) => event.stopPropagation()} className="relative flex flex-col items-center gap-4">
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label={t.common.close}
          className="absolute -top-2 -right-12 flex size-11 cursor-pointer items-center justify-center rounded-full bg-surface/90 text-ink shadow-lg transition hover:scale-105 active:scale-90 max-[400px]:-right-2 max-[400px]:-top-14"
        >
          <X className="size-5" strokeWidth={2.4} />
        </button>
        <div
          ref={photoRef}
          style={{ width: `min(${PHOTO_PX}px, 70vw)`, height: `min(${PHOTO_PX}px, 70vw)` }}
          className="relative rounded-full bg-linear-to-br from-brand-from to-brand-to p-1 shadow-[0_24px_60px_rgba(27,10,60,0.45)] will-change-transform"
        >
          <img
            src={url}
            alt={t.avatar.viewer(name)}
            draggable={false}
            className="size-full rounded-full border-4 border-surface object-cover select-none [-webkit-touch-callout:none]"
          />
        </div>
        <div ref={textRef} className="flex flex-col items-center gap-1 text-center">
          <p id={titleId} className="font-bricolage text-xl font-extrabold text-white drop-shadow">
            {name}
          </p>
          {subtitle && <p className="text-sm font-medium text-white/80">{subtitle}</p>}
          {onChange && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onChange();
              }}
              className="mt-2 h-11 cursor-pointer rounded-full bg-surface px-5 text-sm font-semibold text-ink shadow-lg transition hover:bg-soft active:scale-95"
            >
              {t.avatar.change}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface ViewableAvatarProps {
  /** Photo link; without one (initials) the avatar is not a button. */
  url: string | null;
  name: string;
  subtitle?: string;
  onChange?: () => void;
  /** Classes of the button, e.g. "relative z-10 pointer-events-auto" over a clickable card. */
  className?: string;
  children: ReactNode;
}

/** Wraps an avatar so a tap opens the photo in a small window. */
export function ViewableAvatar({ url, name, subtitle, onChange, className = '', children }: ViewableAvatarProps) {
  const t = useT();
  const [origin, setOrigin] = useState<DOMRect | null>(null);
  /** Inside an open <dialog> (swap details) the window must live in it: the rest of the page is inert. */
  const [host, setHost] = useState<Element | null>(null);
  if (!url) return <>{children}</>;

  const open = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setHost(event.currentTarget.closest('dialog[open]') ?? document.body);
    setOrigin(event.currentTarget.getBoundingClientRect());
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label={t.avatar.view(name)}
        aria-haspopup="dialog"
        className={`shrink-0 cursor-zoom-in rounded-full transition hover:brightness-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-from ${className}`}
      >
        {children}
      </button>
      {origin &&
        host &&
        createPortal(
          <AvatarViewer
            url={url}
            name={name}
            subtitle={subtitle}
            origin={origin}
            onChange={onChange}
            onClose={() => setOrigin(null)}
          />,
          host,
        )}
    </>
  );
}
