'use client';

import { useState } from 'react';
import { useAvatarUrl } from '@/lib/avatar';

interface UserAvatarProps {
  initials: string;
  /** Storage path of the photo, or null for initials. */
  path: string | null | undefined;
  /** Tailwind size and text classes, e.g. "size-10 text-xs". */
  className?: string;
}

/** Round avatar: the profile photo, or the initials on lilac when there is none (or it fails to load). */
export function UserAvatar({ initials, path, className = 'size-10 text-xs' }: UserAvatarProps) {
  const url = useAvatarUrl(path);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPhoto = url !== null && url !== failedUrl;

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft font-semibold text-brand-ink ${className}`}
    >
      {showPhoto ? (
        <img
          key={url}
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setFailedUrl(url)}
          // Round itself and not touchable: iOS long-press previews showed it square.
          className="size-full animate-pop rounded-full object-cover pointer-events-none select-none [-webkit-touch-callout:none] motion-reduce:animate-none"
        />
      ) : (
        initials
      )}
    </span>
  );
}
