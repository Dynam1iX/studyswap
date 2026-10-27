'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { ViewableAvatar } from '@/components/ui/AvatarViewer';
import { useT } from '@/i18n';

interface AvatarProps {
  initials: string;
  /** Profile photo URL, or null for initials. */
  url?: string | null;
  onEdit?: () => void;
  /** Spins the gradient ring while a new photo uploads. */
  busy?: boolean;
  /** Name and subtitle for the photo window; without them the photo does not open. */
  view?: { name: string; subtitle: string };
}

/** Gradient ring avatar. The edit badge shares the same grid cell instead of absolute positioning. */
export function Avatar({ initials, url = null, onEdit, busy = false, view }: AvatarProps) {
  const t = useT();
  // Initials if the photo cannot be loaded (deleted file, offline).
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPhoto = url !== null && url !== failedUrl;

  return (
    <div className="grid size-20 shrink-0 animate-pop motion-reduce:animate-none">
      <ViewableAvatar
        url={view && showPhoto && !busy ? url : null}
        name={view?.name ?? ''}
        subtitle={view?.subtitle}
        onChange={busy ? undefined : onEdit}
        className="relative col-start-1 row-start-1 block size-20"
      >
      <div className="relative col-start-1 row-start-1 size-20 rounded-full p-[3px]">
        {/* Ring: a conic gradient that spins while uploading */}
        <span
          aria-hidden
          className={`absolute inset-0 rounded-full ${
            busy
              ? 'animate-spin bg-[conic-gradient(var(--color-brand-from),var(--color-brand-to),transparent_70%,var(--color-brand-from))] [animation-duration:900ms]'
              : 'bg-linear-to-br from-brand-from to-brand-to'
          }`}
        />
        <div className="relative flex size-full items-center justify-center overflow-hidden rounded-full border-[3px] border-surface bg-brand-soft">
          {showPhoto ? (
            <img
              key={url}
              src={url}
              alt=""
              draggable={false}
              onError={() => setFailedUrl(url)}
              // Round itself and not touchable: iOS long-press previews showed it square.
              className="size-full animate-pop rounded-full object-cover pointer-events-none select-none [-webkit-touch-callout:none] motion-reduce:animate-none"
            />
          ) : (
            <span className="font-bricolage text-2xl font-extrabold text-brand-ink">{initials}</span>
          )}
        </div>
      </div>
      </ViewableAvatar>
      {onEdit && (
      <button
        type="button"
        onClick={onEdit}
        disabled={busy}
        aria-label={t.avatar.change}
        aria-haspopup="dialog"
        className="relative z-10 col-start-1 row-start-1 flex size-8 cursor-pointer items-center justify-center self-end justify-self-end rounded-full border-[3px] border-surface bg-ink text-page transition-transform hover:-rotate-12 hover:scale-110 active:scale-90 disabled:cursor-wait disabled:opacity-60 disabled:hover:rotate-0 disabled:hover:scale-100"
      >
        <Pencil className="size-3.5" strokeWidth={2.4} />
      </button>
      )}
    </div>
  );
}
