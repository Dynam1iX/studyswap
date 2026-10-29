'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, FileText, X, ZoomIn, ZoomOut } from 'lucide-react';
import { lockPageScroll } from '@/components/ui/BottomSheet';
import { useCardFileUrls, type CardFile } from '@/lib/cardFiles';
import { useT } from '@/i18n';

/**
 * "Examples of tasks" in the swap window: photos open full screen (swipe or arrows,
 * tap to zoom), PDFs open in a new tab.
 */
export function TaskFiles({ files }: { files: CardFile[] }) {
  const t = useT();
  const urls = useCardFileUrls(files.map((file) => file.path));
  const photos = files.filter((file) => file.kind === 'image');
  const [viewer, setViewer] = useState<{ index: number; host: Element; tiles: (HTMLElement | null)[] } | null>(null);
  const tileRefs = useRef<(HTMLElement | null)[]>([]);

  if (files.length === 0) return null;

  const openPhoto = (event: ReactMouseEvent<HTMLButtonElement>, file: CardFile) => {
    setViewer({
      index: photos.indexOf(file),
      host: event.currentTarget.closest('dialog[open]') ?? document.body,
      tiles: photos.map((photo) => tileRefs.current[files.indexOf(photo)] ?? null),
    });
  };

  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-bricolage text-[17px] font-bold text-ink">{t.files.title}</h3>
      <ul className="grid grid-cols-3 gap-2">
        {files.map((file, index) => {
          const url = urls[file.path];
          return (
            <li key={file.id} style={{ animationDelay: `${index * 60}ms` }} className="animate-pop motion-reduce:animate-none">
              {file.kind === 'image' ? (
                <button
                  ref={(node) => {
                    tileRefs.current[index] = node;
                  }}
                  type="button"
                  onClick={(event) => openPhoto(event, file)}
                  disabled={!url}
                  aria-label={t.files.openPhoto(file.name)}
                  className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl bg-soft transition active:scale-95 focus-visible:outline-2 focus-visible:outline-brand-from"
                >
                  {url ? (
                    <img
                      src={url}
                      alt=""
                      draggable={false}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="block size-full animate-pulse bg-line" />
                  )}
                </button>
              ) : (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={url ? undefined : true}
                  aria-label={t.files.openPdf(file.name)}
                  className="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-line bg-soft p-2 text-center no-underline transition hover:border-brand-from active:scale-95 aria-disabled:pointer-events-none aria-disabled:opacity-60"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[#E5484D] text-white shadow-[0_6px_14px_rgba(229,72,77,0.35)]">
                    <FileText className="size-5" strokeWidth={2.2} />
                  </span>
                  <span className="line-clamp-2 w-full text-[11px] leading-tight font-semibold break-all text-ink">{file.name}</span>
                </a>
              )}
            </li>
          );
        })}
      </ul>
      {viewer &&
        createPortal(
          <PhotoViewer
            photos={photos}
            urls={urls}
            start={viewer.index}
            tiles={viewer.tiles}
            onClose={() => setViewer(null)}
          />,
          viewer.host,
        )}
    </section>
  );
}

const OPEN_MS = 420;
const CLOSE_MS = 260;

/** From the photo's place on screen to the tile it was opened from. */
function toTile(photo: HTMLElement, tile: HTMLElement | null): string | null {
  if (!tile) return null;
  const from = tile.getBoundingClientRect();
  const box = photo.getBoundingClientRect();
  if (!box.width || !box.height || !from.width) return null;
  const dx = from.left + from.width / 2 - (box.left + box.width / 2);
  const dy = from.top + from.height / 2 - (box.top + box.height / 2);
  const scale = Math.max(from.width / box.width, from.height / box.height);
  return `translate(${dx}px, ${dy}px) scale(${scale})`;
}

function PhotoViewer({
  photos,
  urls,
  start,
  tiles,
  onClose,
}: {
  photos: CardFile[];
  urls: Record<string, string>;
  start: number;
  tiles: (HTMLElement | null)[];
  onClose: () => void;
}) {
  const t = useT();
  const [index, setIndex] = useState(start);
  const [zoomed, setZoomed] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const reduced = useRef(false);
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null);
  const [dragX, setDragX] = useState(0);
  const count = photos.length;
  const photo = photos[index];

  // Grows out of the tapped tile.
  useLayoutEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    backdropRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
    const image = photoRef.current;
    if (image) {
      const from = reduced.current ? null : toTile(image, tiles[start]);
      image.animate(
        from
          ? [{ transform: from, borderRadius: '24px', opacity: 0.6 }, { transform: 'none', borderRadius: '16px', opacity: 1 }]
          : [{ opacity: 0 }, { opacity: 1 }],
        { duration: from ? OPEN_MS : 160, easing: 'cubic-bezier(0.22, 1.2, 0.36, 1)' },
      );
    }
    closeRef.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    backdropRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: CLOSE_MS, fill: 'forwards' });
    const image = photoRef.current;
    const to = image && !zoomed && !reduced.current ? toTile(image, tiles[index]) : null;
    if (!image) return onClose();
    const animation = image.animate(
      to ? [{ transform: 'none', opacity: 1 }, { transform: to, opacity: 0.4 }] : [{ opacity: 1 }, { opacity: 0 }],
      { duration: to ? CLOSE_MS : 140, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' },
    );
    animation.onfinish = onClose;
  };

  /** Slides to the next / previous photo (the new one comes in from that side). */
  const go = (step: 1 | -1) => {
    if (count < 2) return;
    setZoomed(false);
    setDragX(0);
    setIndex((current) => (current + step + count) % count);
    requestAnimationFrame(() => {
      if (reduced.current) return;
      photoRef.current?.animate(
        [
          { transform: `translateX(${step * 60}px) scale(0.96)`, opacity: 0 },
          { transform: 'none', opacity: 1 },
        ],
        { duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      );
    });
  };

  // Esc closes, ← → change the photo; the page underneath does not scroll.
  useEffect(() => {
    const unlock = lockPageScroll();
    const returnTo = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        event.preventDefault();
        close();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        go(1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        go(-1);
      } else if (event.key === 'Tab') {
        const buttons = [...(backdropRef.current?.querySelectorAll<HTMLElement>('button') ?? [])];
        const at = buttons.indexOf(document.activeElement as HTMLElement);
        event.preventDefault();
        event.stopPropagation();
        buttons[(at + (event.shiftKey ? buttons.length - 1 : 1)) % buttons.length]?.focus();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      unlock();
      returnTo?.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Tap the photo: twice as large, scroll to where it was tapped; tap again: back. */
  const toggleZoom = (event?: ReactMouseEvent) => {
    const image = photoRef.current;
    if (!zoomed && image && event) {
      const box = image.getBoundingClientRect();
      const fx = (event.clientX - box.left) / box.width;
      const fy = (event.clientY - box.top) / box.height;
      setZoomed(true);
      requestAnimationFrame(() => {
        const area = zoomRef.current;
        if (!area) return;
        area.scrollLeft = fx * area.scrollWidth - area.clientWidth / 2;
        area.scrollTop = fy * area.scrollHeight - area.clientHeight / 2;
      });
    } else {
      setZoomed((value) => !value);
    }
  };

  // Swipe left / right to change the photo (not while zoomed: then the finger scrolls).
  const onPointerDown = (event: ReactPointerEvent) => {
    if (zoomed || count < 2 || event.pointerType === 'mouse') return;
    swipe.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
  };
  const onPointerMove = (event: ReactPointerEvent) => {
    const start = swipe.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) > Math.abs(event.clientY - start.y)) setDragX(dx);
  };
  const onPointerUp = () => {
    if (!swipe.current) return;
    swipe.current = null;
    if (Math.abs(dragX) > 60) go(dragX < 0 ? 1 : -1);
    else setDragX(0);
  };

  const url = photo ? urls[photo.path] : undefined;

  return (
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      aria-label={photo?.name}
      onClick={close}
      className="fixed inset-0 z-[100] flex flex-col bg-[rgba(14,8,30,0.88)] backdrop-blur-md"
    >
      {/* Top bar: counter · zoom · close */}
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex shrink-0 items-center justify-between gap-3 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-2 text-white"
      >
        <span className="min-w-0 truncate text-sm font-semibold text-white/85">
          {count > 1 ? `${t.files.of(index + 1, count)} · ` : ''}
          {photo?.name}
        </span>
        <span className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => toggleZoom()}
            aria-label={zoomed ? t.files.zoomOut : t.files.zoomIn}
            aria-pressed={zoomed}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-white/12 transition hover:bg-white/20 active:scale-90"
          >
            {zoomed ? <ZoomOut className="size-5" /> : <ZoomIn className="size-5" />}
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label={t.common.close}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-white/12 transition hover:bg-white/20 active:scale-90"
          >
            <X className="size-5" strokeWidth={2.4} />
          </button>
        </span>
      </div>

      {/* The photo */}
      <div
        ref={zoomRef}
        className={`relative min-h-0 flex-1 ${zoomed ? 'overflow-auto' : 'flex items-center justify-center overflow-hidden px-4 pb-4'}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {url && (
          <img
            ref={photoRef}
            src={url}
            alt={photo.name}
            draggable={false}
            onClick={(event) => {
              event.stopPropagation();
              toggleZoom(event);
            }}
            style={!zoomed && dragX ? { transform: `translateX(${dragX}px) rotate(${dragX / 40}deg)` } : undefined}
            className={
              zoomed
                ? 'block w-[200%] max-w-none cursor-zoom-out select-none'
                : `max-h-full max-w-full cursor-zoom-in rounded-2xl object-contain shadow-[0_24px_60px_rgba(0,0,0,0.45)] select-none [-webkit-touch-callout:none] ${
                    dragX ? '' : 'transition-transform duration-300 ease-out'
                  }`
            }
          />
        )}
      </div>

      {/* Arrows and dots (more than one photo) */}
      {count > 1 && (
        <div
          onClick={(event) => event.stopPropagation()}
          className="flex shrink-0 items-center justify-center gap-5 pt-1 pb-[max(20px,env(safe-area-inset-bottom))]"
        >
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={t.files.previous}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/20 active:scale-90"
          >
            <ChevronLeft className="size-6" strokeWidth={2.4} />
          </button>
          <span className="flex gap-1.5" aria-hidden>
            {photos.map((item, at) => (
              <span
                key={item.id}
                className={`h-2 rounded-full transition-all duration-300 ${at === index ? 'w-6 bg-white' : 'w-2 bg-white/40'}`}
              />
            ))}
          </span>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={t.files.next}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/20 active:scale-90"
          >
            <ChevronRight className="size-6" strokeWidth={2.4} />
          </button>
        </div>
      )}
    </div>
  );
}
